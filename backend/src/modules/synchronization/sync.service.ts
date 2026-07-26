/**
 * Repository Sync Service (Incremental Synchronization Engine)
 *
 * Purpose:
 *   Orchestrates incremental repository synchronization by detecting updates
 *   and preparing only new commits for downstream analysis. Achieves O(1)
 *   streaming compatibility by returning oldHead and newHead revision hashes
 *   without reading commit contents, parsing commit messages, computing metrics,
 *   or building commit graphs/arrays.
 *
 * Why this architecture reduces complexity:
 *   - Initial sync: Clones repository disk state and returns `newHead` (`oldHead: null`).
 *   - Subsequent sync: Executes `git fetch`, compares HEAD hashes in O(1)
 *     time using the SnapshotService cache, and returns `oldHead` and `newHead`.
 *   - Zero memory bloat: Downstream streaming engines can pipe oldHead and
 *     newHead directly into `git log / rev-list` stream readers.
 */

import { RepositoryRepository } from '../repository/repository.repository';
import { RepositoryStatus } from '../repository/repository.types';
import { SnapshotService } from './snapshot.service';
import { SyncStatus, SynchronizationReport } from './snapshot.types';
import { CloneService, RepositoryHealth } from '../ingestion/clone.service';
import { GitClient } from '../ingestion/git.client';
import { StorageService } from '../ingestion/storage.service';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class RepositorySyncService {
  private readonly repositoryRepository: RepositoryRepository;
  private readonly snapshotService: SnapshotService;
  private readonly cloneService: CloneService;
  private readonly gitClient: GitClient;
  private readonly storageService: StorageService;

  constructor() {
    this.repositoryRepository = new RepositoryRepository();
    this.snapshotService = new SnapshotService();
    this.cloneService = new CloneService();
    this.gitClient = new GitClient();
    this.storageService = new StorageService();
  }

  /**
   * Performs incremental synchronization on a repository.
   * Detects HEAD changes, updates the snapshot, and returns oldHead + newHead markers.
   *
   * @param repositoryId Internal UUID of the repository.
   * @param forceFetch If true, forces a network fetch even if recently synced.
   */
  async syncRepository(repositoryId: string, _forceFetch: boolean = false): Promise<SynchronizationReport> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new AppError(`Repository with ID ${repositoryId} not found`, HTTP_STATUS.NOT_FOUND, true);
    }

    const startTime = new Date();
    await this.repositoryRepository.updateStatus(repositoryId, RepositoryStatus.SYNCING);

    try {
      // 1. Retrieve current stored snapshot from cache or DB
      const storedSnapshot = await this.snapshotService.getLatestSnapshot(repositoryId);
      const oldHead = storedSnapshot?.headCommit ?? null;

      // 2. Perform disk synchronization (git clone or git fetch)
      const syncResult = await this.cloneService.synchronizeRepository(repository);
      const repoPath = this.storageService.getRepositoryPath(repositoryId);

      // 3. Read current HEAD, default branch, and commit count via Git operations
      const newHead = await this.gitClient.getHeadCommit(repoPath);
      const defaultBranch = await this.gitClient.getDefaultBranch(repoPath);
      const commitCount = await this.gitClient.getCommitCount(repoPath);

      // 4. Update repository metadata in DB
      await this.repositoryRepository.updateSyncSuccess(repositoryId, syncResult.sizeKb, startTime);

      // 5. Compare with stored HEAD and determine sync status
      if (oldHead && oldHead === newHead) {
        // Identical HEAD -> NO_CHANGES (0 parsing, 0 new commits to analyze)
        return {
          status: SyncStatus.NO_CHANGES,
          repositoryId,
          oldHead,
          newHead,
          commitCount,
          syncedAt: startTime,
          message: 'Repository is up to date; no new commits detected.',
        };
      }

      const isFirstSync = !oldHead;
      const status = isFirstSync ? SyncStatus.FIRST_SYNC : SyncStatus.UPDATED;

      // 6. Persist updated snapshot
      await this.snapshotService.saveSnapshot({
        repositoryId,
        headCommit: newHead,
        defaultBranch,
        lastFetchedAt: startTime,
        commitCount,
        lastAnalyzedCommit: storedSnapshot?.lastAnalyzedCommit ?? null,
        analysisVersion: storedSnapshot?.analysisVersion ?? 1,
      });

      // 7. Return structured synchronization report (oldHead + newHead)
      return {
        status,
        repositoryId,
        oldHead,
        newHead,
        commitCount,
        syncedAt: startTime,
        message: isFirstSync
          ? `Initial repository clone complete. Ready to analyze ${commitCount} commits up to ${newHead.slice(0, 7)}.`
          : `Repository updated from ${oldHead?.slice(0, 7)} to ${newHead.slice(0, 7)}. Markers prepared for streaming.`,
      };
    } catch (error: any) {
      await this.repositoryRepository.updateStatus(repositoryId, RepositoryStatus.FAILED);
      throw error instanceof AppError
        ? error
        : new AppError(
            `Synchronization failed for repository ${repositoryId}: ${error?.message || 'Unknown error'}`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            true,
          );
    }
  }

  /**
   * Verifies the physical filesystem health of a cached repository on disk.
   *
   * @param repositoryId Internal UUID of the repository.
   */
  async verifyRepositoryHealth(repositoryId: string): Promise<RepositoryHealth> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new AppError(`Repository with ID ${repositoryId} not found`, HTTP_STATUS.NOT_FOUND, true);
    }

    return await this.cloneService.verifyHealth(repository);
  }
}
