/**
 * Engineering Graph Service (Graph Assembly & Query Orchestrator)
 *
 * Purpose:
 *   Subscribes to the CommitEventPublisher to receive immutable CommitEvents
 *   and orchestrates real-time graph construction via GraphBuilder.
 *   Provides query methods for retrieving nodes and edges by future analytical engines.
 *
 * Why this service decouples graph building from metrics:
 *   By constructing clean structural relationships (AUTHORED, MODIFIED, PARENT_OF)
 *   before any numerical calculation occurs, we establish a clean graph schema.
 *   Later sprint modules (Bus Factor, Knowledge Islands, Hotspots) query this service
 *   to traverse topology without re-parsing Git logs or writing ad-hoc SQL JOINs.
 */

import { CommitEventPublisher } from '../streaming/event.publisher';
import { CommitEvent } from '../streaming/commit.event';
import { GraphBuilder } from './graph.builder';
import { GraphRepository } from './graph.repository';
import { GraphMapper } from './graph.mapper';
import { DeveloperNodeDto, CommitNodeDto, FileNodeDto, GraphEdgeDto } from './graph.types';

export class GraphService {
  private readonly builder: GraphBuilder;
  private readonly repository: GraphRepository;
  private readonly mapper: GraphMapper;
  private unsubscribeToken: (() => void) | null = null;

  constructor() {
    this.repository = new GraphRepository();
    this.builder = new GraphBuilder(this.repository);
    this.mapper = new GraphMapper();
  }

  /**
   * Subscribes the GraphService to an active CommitEventPublisher.
   * Every streamed CommitEvent triggers idempotent graph node and edge construction.
   *
   * @param publisher The active in-process event publisher.
   */
  subscribeToPublisher(publisher: CommitEventPublisher): void {
    if (this.unsubscribeToken) {
      this.unsubscribeToken();
    }

    this.unsubscribeToken = publisher.subscribe(async (event: CommitEvent) => {
      await this.buildFromEvent(event);
    });
  }

  /**
   * Detaches the GraphService from the publisher if currently subscribed.
   */
  unsubscribe(): void {
    if (this.unsubscribeToken) {
      this.unsubscribeToken();
      this.unsubscribeToken = null;
    }
  }

  /**
   * Delegates event processing to GraphBuilder for idempotent node/edge creation.
   *
   * @param event The immutable CommitEvent domain object.
   */
  async buildFromEvent(event: CommitEvent): Promise<void> {
    await this.builder.buildFromEvent(event);
  }

  /**
   * Retrieves a Developer graph node DTO by email.
   */
  async getDeveloperByEmail(email: string): Promise<DeveloperNodeDto | null> {
    const rec = await this.repository.findDeveloperByEmail(email);
    return rec ? this.mapper.toDeveloperDto(rec) : null;
  }

  /**
   * Retrieves a CommitNode graph DTO by SHA hash.
   */
  async getCommitNodeByHash(hash: string): Promise<CommitNodeDto | null> {
    const rec = await this.repository.findCommitNodeByHash(hash);
    return rec ? this.mapper.toCommitNodeDto(rec) : null;
  }

  /**
   * Retrieves a FileNode graph DTO by repository ID and file path.
   */
  async getFileNodeByPath(repositoryId: string, path: string): Promise<FileNodeDto | null> {
    const rec = await this.repository.findFileNodeByPath(repositoryId, path);
    return rec ? this.mapper.toFileNodeDto(rec) : null;
  }

  /**
   * Retrieves all GraphEdge DTOs for a specified repository.
   */
  async getEdgesByRepository(repositoryId: string): Promise<GraphEdgeDto[]> {
    const recs = await this.repository.findEdgesByRepository(repositoryId);
    return recs.map((rec) => this.mapper.toGraphEdgeDto(rec));
  }

  /**
   * Clears in-memory HashMaps in the underlying GraphBuilder.
   */
  clearCache(): void {
    this.builder.clearCache();
  }

  /**
   * Returns current cache sizes from GraphBuilder.
   */
  get cacheStats(): { developers: number; commits: number; files: number } {
    return this.builder.cacheStats;
  }
}
