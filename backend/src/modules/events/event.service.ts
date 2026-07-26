/**
 * Event Service (Raw Event Store Ingest & Query Orchestrator)
 *
 * Purpose:
 *   Subscribes to the CommitEventPublisher to receive immutable CommitEvents
 *   as they are streamed from Git history. Orchestrates mapping from domain
 *   events to persistence DTOs and guarantees exactly-once persistence in
 *   PostgreSQL without accumulating commit arrays in memory.
 *
 * Why this service separates persistence from streaming:
 *   The CommitStreamService (Phase 4) is a pure generator that knows nothing about
 *   databases or SQL schemas. EventService acts as a decoupled consumer that
 *   ingests the stream and establishes the single source of truth in PostgreSQL.
 *   Once ingested, future engines (Metrics, AI, Graph) query EventService instead
 *   of executing expensive filesystem Git CLI operations.
 */

import { CommitEventPublisher } from '../streaming/event.publisher';
import { CommitEvent } from '../streaming/commit.event';
import { EventMapper } from './event.mapper';
import { EventRepository } from './event.repository';
import { EventPaginationOptions } from './event.types';

export class EventService {
  private readonly mapper: EventMapper;
  private readonly repository: EventRepository;
  private unsubscribeToken: (() => void) | null = null;

  constructor() {
    this.mapper = new EventMapper();
    this.repository = new EventRepository();
  }

  /**
   * Subscribes the EventService to an active CommitEventPublisher.
   * Every published CommitEvent will be mapped and persisted exactly once.
   *
   * @param publisher The active in-process event publisher.
   */
  subscribeToPublisher(publisher: CommitEventPublisher): void {
    if (this.unsubscribeToken) {
      this.unsubscribeToken();
    }

    this.unsubscribeToken = publisher.subscribe(async (event: CommitEvent) => {
      await this.persistEvent(event);
    });
  }

  /**
   * Detaches the EventService from the publisher if currently subscribed.
   */
  unsubscribe(): void {
    if (this.unsubscribeToken) {
      this.unsubscribeToken();
      this.unsubscribeToken = null;
    }
  }

  /**
   * Receives an immutable CommitEvent, maps it to a persistence DTO via EventMapper,
   * and saves it to PostgreSQL exactly once. Duplicates are silently ignored.
   *
   * @param event The immutable CommitEvent domain object.
   * @returns True if newly inserted into PostgreSQL, false if ignored as duplicate.
   */
  async persistEvent(event: CommitEvent): Promise<boolean> {
    const dto = this.mapper.toPersistenceDto(event);
    return await this.repository.save(dto);
  }

  /**
   * Checks whether a commit event already exists in the Raw Event Store.
   *
   * @param hash Cryptographically unique Git SHA.
   * @returns True if present in PostgreSQL, false otherwise.
   */
  async exists(hash: string): Promise<boolean> {
    return await this.repository.exists(hash);
  }

  /**
   * Retrieves an immutable CommitEvent domain object from PostgreSQL by its hash.
   *
   * @param hash Cryptographically unique Git SHA.
   * @returns Immutable CommitEvent domain object or null if not found.
   */
  async getByHash(hash: string): Promise<CommitEvent | null> {
    const record = await this.repository.findByHash(hash);
    return record ? this.mapper.toDomainEvent(record) : null;
  }

  /**
   * Retrieves a paginated array of immutable CommitEvent domain objects for a repository.
   *
   * @param repositoryId UUID of the target repository.
   * @param options Pagination limits and offsets.
   * @returns Array of immutable CommitEvent domain objects.
   */
  async getByRepository(repositoryId: string, options?: EventPaginationOptions): Promise<CommitEvent[]> {
    const records = await this.repository.findByRepository(repositoryId, options);
    return records.map((record) => this.mapper.toDomainEvent(record));
  }
}
