/**
 * Repository Snapshot & Synchronization Domain Types
 *
 * Purpose:
 *   Defines domain data structures for point-in-time repository snapshots
 *   and incremental synchronization reports. Enforces O(1) streaming
 *   compatibility by storing commit hashes and revision markers as immutable
 *   strings rather than in-memory commit arrays or graphs.
 */

export interface RepositorySnapshot {
  id: string;
  repositoryId: string;
  headCommit: string;
  defaultBranch: string;
  lastFetchedAt: Date;
  lastAnalyzedCommit?: string | null;
  commitCount: number;
  analysisVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSnapshotInput {
  repositoryId: string;
  headCommit: string;
  defaultBranch: string;
  lastFetchedAt: Date;
  commitCount: number;
  lastAnalyzedCommit?: string | null;
  analysisVersion?: number;
}

export enum SyncStatus {
  NO_CHANGES = 'NO_CHANGES',
  UPDATED = 'UPDATED',
  FIRST_SYNC = 'FIRST_SYNC',
  FAILED = 'FAILED',
}

export interface SynchronizationReport {
  status: SyncStatus;
  repositoryId: string;
  oldHead: string | null;
  newHead: string;
  commitCount: number;
  syncedAt: Date;
  message: string;
}
