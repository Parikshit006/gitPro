/**
 * Event Mapper (Domain <-> Persistence Transformation)
 *
 * Purpose:
 *   Strictly isolates database persistence schemas from domain entities.
 *   Converts immutable CommitEvent objects to database DTOs and maps raw
 *   Prisma database records back into runtime-frozen CommitEvent domain objects.
 *
 * Why model leakage is forbidden:
 *   Exposing Prisma ORM models directly to service layers creates tight coupling
 *   between application logic and PostgreSQL table schemas. EventMapper guarantees
 *   that domain subscribers only ever receive clean CommitEvent instances.
 */

import { CommitEvent } from '../streaming/commit.event';
import { CommitEventRecordDto } from './event.types';

export class EventMapper {
  /**
   * Converts an immutable domain CommitEvent into a Database Persistence DTO.
   */
  toPersistenceDto(event: CommitEvent): CommitEventRecordDto {
    return {
      repositoryId: event.repositoryId,
      hash: event.hash,
      parentHashes: [...event.parents],
      authorName: event.authorName,
      authorEmail: event.authorEmail,
      authoredAt: event.authorDate,
      committedAt: event.committerDate,
      message: event.message,
      version: 1,
    };
  }

  /**
   * Converts a raw database record or persistence DTO back into an immutable domain CommitEvent.
   */
  toDomainEvent(record: any): CommitEvent {
    const parents = Array.isArray(record.parentHashes) ? record.parentHashes : [];
    return new CommitEvent({
      repositoryId: record.repositoryId,
      hash: record.hash,
      parents,
      authorName: record.authorName,
      authorEmail: record.authorEmail,
      authorDate: new Date(record.authoredAt),
      committerName: record.committerName,
      committerEmail: record.committerEmail,
      committerDate: new Date(record.committedAt),
      message: record.message,
      timestamp: record.createdAt ? new Date(record.createdAt) : undefined,
    });
  }
}
