/**
 * Snapshot Service (Synchronization Persistence & Cache Layer)
 *
 * Purpose:
 *   Manages the persistence of RepositorySnapshot records in PostgreSQL
 *   and maintains an in-memory SnapshotCache abstraction for O(1) memory
 *   access to active repository synchronization states.
 *
 * Why an in-memory cache abstraction is used:
 *   During high-frequency synchronization or incremental streaming checks,
 *   querying the database repeatedly for the stored HEAD commit hash creates
 *   unnecessary I/O overhead. Caching the active snapshot in memory ensures
 *   HEAD divergence checks and range preparations execute in O(1) time.
 */

import { prisma } from '../../lib/prisma';
import { RepositorySnapshot, CreateSnapshotInput } from './snapshot.types';
import { SnapshotCache } from './snapshot.cache';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

/**
 * Converts a raw Prisma RepositorySnapshot record into a clean domain object.
 */
function toDomainSnapshot(record: any): RepositorySnapshot {
  return {
    id: record.id,
    repositoryId: record.repositoryId,
    headCommit: record.headCommit,
    defaultBranch: record.defaultBranch,
    lastFetchedAt: record.lastFetchedAt,
    lastAnalyzedCommit: record.lastAnalyzedCommit,
    commitCount: record.commitCount,
    analysisVersion: record.analysisVersion ?? 1,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class SnapshotService {
  /**
   * In-memory cache store abstraction for active repository snapshots.
   * Guarantees O(1) time and memory access during synchronization checks.
   */
  private readonly cache = new SnapshotCache();

  /**
   * Retrieves the most recent snapshot for a given repository.
   * Checks the in-memory cache first; falls back to database query on cache miss.
   *
   * @param repositoryId Internal UUID of the repository.
   */
  async getLatestSnapshot(repositoryId: string): Promise<RepositorySnapshot | null> {
    if (this.cache.has(repositoryId)) {
      return this.cache.get(repositoryId)!;
    }

    try {
      const record = await prisma.repositorySnapshot.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        return null;
      }

      const snapshot = toDomainSnapshot(record);
      this.cache.set(repositoryId, snapshot);
      return snapshot;
    } catch {
      throw new AppError(
        'Failed to query repository snapshot from database',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Persists a new synchronization snapshot to the database and updates the cache.
   *
   * @param input Snapshot creation payload.
   */
  async saveSnapshot(input: CreateSnapshotInput): Promise<RepositorySnapshot> {
    try {
      const record = await prisma.repositorySnapshot.create({
        data: {
          repositoryId: input.repositoryId,
          headCommit: input.headCommit,
          defaultBranch: input.defaultBranch,
          lastFetchedAt: input.lastFetchedAt,
          commitCount: input.commitCount,
          lastAnalyzedCommit: input.lastAnalyzedCommit ?? null,
          analysisVersion: input.analysisVersion ?? 1,
        },
      });

      const snapshot = toDomainSnapshot(record);
      this.cache.set(input.repositoryId, snapshot);
      return snapshot;
    } catch {
      throw new AppError(
        'Failed to save repository snapshot record',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Updates the `lastAnalyzedCommit` marker for a repository after downstream streaming completes.
   *
   * @param repositoryId Internal UUID of the repository.
   * @param commitHash The commit SHA that was last successfully analyzed.
   */
  async updateLastAnalyzedCommit(repositoryId: string, commitHash: string): Promise<RepositorySnapshot | null> {
    const current = await this.getLatestSnapshot(repositoryId);
    if (!current) {
      return null;
    }

    try {
      const record = await prisma.repositorySnapshot.update({
        where: { id: current.id },
        data: { lastAnalyzedCommit: commitHash },
      });

      const updated = toDomainSnapshot(record);
      this.cache.set(repositoryId, updated);
      return updated;
    } catch {
      throw new AppError(
        'Failed to update lastAnalyzedCommit marker',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Clears the in-memory cache for a specific repository or all repositories.
   */
  clearCache(repositoryId?: string): void {
    if (repositoryId) {
      this.cache.delete(repositoryId);
    } else {
      this.cache.clear();
    }
  }
}
