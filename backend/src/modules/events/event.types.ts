/**
 * Raw Event Store Domain & Persistence Types
 *
 * Purpose:
 *   Defines persistence DTOs and query parameter interfaces for storing and
 *   retrieving immutable historical Git commit events in PostgreSQL.
 */

export interface CommitEventRecordDto {
  id?: string;
  repositoryId: string;
  hash: string;
  parentHashes: string[];
  authorName: string;
  authorEmail: string;
  authoredAt: Date;
  committedAt: Date;
  message: string;
  version?: number;
  createdAt?: Date;
}

export interface EventPaginationOptions {
  limit?: number;
  offset?: number;
}
