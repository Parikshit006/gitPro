/**
 * Clone Service (Orchestration & Repository Caching Engine)
 *
 * Purpose:
 *   Orchestrates downloading and synchronizing GitHub repositories to local disk.
 *   Enforces caching rules (clone once, fetch subsequently), emits structured
 *   observability logs, and performs health verifications on cached storage.
 *
 * Why a normal non-bare clone was selected over a mirror clone (Trade-Off Analysis):
 *   A mirror clone (`--mirror` / `--bare`) creates a bare Git database without a working
 *   directory. While this reduces disk space usage by ~50% and eliminates Windows file-lock
 *   contention on checked-out files, it results in a directory structure where the root IS
 *   the Git database (no `.git` subdirectory exists).
 *   We selected a normal non-bare clone because:
 *     1. It explicitly satisfies architectural health verification standards requiring a
 *        distinct `.git` database folder and `.git/HEAD` reference file on disk.
 *     2. Future engineering intelligence mining phases (AI code analysis, AST parsing,
 *        static linters) require physical source code files on disk. A normal clone makes
 *        these files directly accessible without managing temporary Git worktrees.
 *
 * Why no git commands are executed directly:
 *   All Git interactions are delegated to GitClient, and all filesystem path resolutions
 *   are delegated to StorageService. This strict separation of concerns prevents clone
 *   logic from becoming entangled with low-level process execution or OS path rules.
 */

import fs from 'fs';
import path from 'path';
import { Repository } from '../repository/repository.types';
import { GitClient } from './git.client';
import { StorageService } from './storage.service';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export interface RepositoryHealth {
  repositoryExists: boolean;
  gitExists: boolean;
  headExists: boolean;
  configExists: boolean;
  isValidGitRepo: boolean;
  currentHead?: string;
  commitCount?: number;
  isHealthy: boolean;
}

export interface SyncResult {
  status: 'CLONED' | 'FETCHED';
  head: string;
  commitCount: number;
  sizeKb: number;
  durationMs: number;
}

export class CloneService {
  private readonly gitClient: GitClient;
  private readonly storageService: StorageService;

  constructor() {
    this.gitClient = new GitClient();
    this.storageService = new StorageService();
  }

  /**
   * Checks whether the repository has already been cloned and is cached locally.
   *
   * @param repository Domain Repository object.
   */
  async repositoryExists(repository: Repository): Promise<boolean> {
    const repoPath = this.storageService.getRepositoryPath(repository.id);
    const existsOnDisk = await this.storageService.repositoryStorageExists(repository.id);
    if (!existsOnDisk) {
      return false;
    }
    return await this.gitClient.isRepository(repoPath);
  }

  /**
   * Clones a repository from GitHub to local disk.
   *
   * @param repository Domain Repository object.
   */
  async cloneRepository(repository: Repository): Promise<{ head: string; commitCount: number; sizeKb: number; durationMs: number }> {
    const repoPath = this.storageService.getRepositoryPath(repository.id);

    // Guard against re-cloning if folder or repo already exists
    const exists = await this.repositoryExists(repository);
    if (exists) {
      throw new AppError(
        `Repository already exists in cache: ${repository.fullName} (${repository.id})`,
        HTTP_STATUS.CONFLICT,
        true,
      );
    }

    // Ensure parent directory exists
    await this.storageService.ensureStorageDirectory(repository.id);

    const startTime = Date.now();
    this.logEvent('Clone Started', {
      repositoryId: repository.id,
      fullName: repository.fullName,
      cloneUrl: repository.cloneUrl,
      targetPath: repoPath,
    });

    try {
      // Execute normal non-bare clone
      await this.gitClient.clone(repository.cloneUrl, repoPath);

      const durationMs = Date.now() - startTime;
      const head = await this.gitClient.getCurrentHead(repoPath);
      const commitCount = await this.gitClient.getCommitCount(repoPath);
      const sizeKb = await this.computeDirectorySizeKb(repoPath);

      this.logEvent('Clone Finished', {
        repositoryId: repository.id,
        fullName: repository.fullName,
        durationMs,
        sizeKb,
        commitCount,
        head,
      });

      return { head, commitCount, sizeKb, durationMs };
    } catch (error: any) {
      // Cleanup partial clone storage on failure
      await this.storageService.deleteRepositoryStorage(repository.id);
      throw new AppError(
        `Failed to clone repository ${repository.fullName}: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Fetches updates from the remote origin for an already cached repository.
   *
   * @param repository Domain Repository object.
   */
  async fetchRepository(repository: Repository): Promise<{ head: string; commitCount: number; sizeKb: number; durationMs: number }> {
    const repoPath = this.storageService.getRepositoryPath(repository.id);

    const exists = await this.repositoryExists(repository);
    if (!exists) {
      throw new AppError(
        `Cannot fetch: repository cache does not exist for ${repository.fullName} (${repository.id})`,
        HTTP_STATUS.NOT_FOUND,
        true,
      );
    }

    const startTime = Date.now();
    this.logEvent('Fetch Started', {
      repositoryId: repository.id,
      fullName: repository.fullName,
      targetPath: repoPath,
    });

    try {
      await this.gitClient.fetch(repoPath);

      const durationMs = Date.now() - startTime;
      const head = await this.gitClient.getCurrentHead(repoPath);
      const commitCount = await this.gitClient.getCommitCount(repoPath);
      const sizeKb = await this.computeDirectorySizeKb(repoPath);

      this.logEvent('Fetch Finished', {
        repositoryId: repository.id,
        fullName: repository.fullName,
        durationMs,
        sizeKb,
        commitCount,
        head,
      });

      return { head, commitCount, sizeKb, durationMs };
    } catch (error: any) {
      throw new AppError(
        `Failed to fetch repository ${repository.fullName}: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Orchestrates repository caching: clones if absent, fetches if already present.
   *
   * @param repository Domain Repository object.
   */
  async synchronizeRepository(repository: Repository): Promise<SyncResult> {
    const isCached = await this.repositoryExists(repository);

    if (isCached) {
      const { head, commitCount, sizeKb, durationMs } = await this.fetchRepository(repository);
      return { status: 'FETCHED', head, commitCount, sizeKb, durationMs };
    } else {
      const { head, commitCount, sizeKb, durationMs } = await this.cloneRepository(repository);
      return { status: 'CLONED', head, commitCount, sizeKb, durationMs };
    }
  }

  /**
   * Performs health verification on a cached repository on local disk.
   *
   * Verifies:
   *   1. Repository exists on disk
   *   2. .git database directory exists
   *   3. .git/HEAD reference file exists
   *   4. GitClient recognizes it as a valid Git repository
   *
   * @param repository Domain Repository object.
   */
  async verifyHealth(repository: Repository): Promise<RepositoryHealth> {
    const repoPath = this.storageService.getRepositoryPath(repository.id);
    const gitPath = this.storageService.getGitDbPath(repository.id);
    const headPath = this.storageService.getHeadPath(repository.id);
    const configPath = path.join(gitPath, 'config');

    const repositoryExists = await this.storageService.repositoryStorageExists(repository.id);

    let gitExists = false;
    try {
      const stat = await fs.promises.stat(gitPath);
      gitExists = stat.isDirectory();
    } catch {
      gitExists = false;
    }

    let headExists = false;
    try {
      const stat = await fs.promises.stat(headPath);
      headExists = stat.isFile();
    } catch {
      headExists = false;
    }

    let configExists = false;
    try {
      const stat = await fs.promises.stat(configPath);
      configExists = stat.isFile();
    } catch {
      configExists = false;
    }

    const isValidGitRepo = repositoryExists ? await this.gitClient.isRepository(repoPath) : false;

    let currentHead: string | undefined;
    let commitCount: number | undefined;
    if (isValidGitRepo) {
      try {
        currentHead = await this.gitClient.getCurrentHead(repoPath);
        commitCount = await this.gitClient.getCommitCount(repoPath);
      } catch {
        currentHead = undefined;
        commitCount = undefined;
      }
    }

    const isHealthy = repositoryExists && gitExists && headExists && configExists && isValidGitRepo && !!currentHead;

    return {
      repositoryExists,
      gitExists,
      headExists,
      configExists,
      isValidGitRepo,
      currentHead,
      commitCount,
      isHealthy,
    };
  }

  /**
   * Helper method to emit structured JSON logs for observability.
   */
  private logEvent(event: string, payload: Record<string, any>): void {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Computes directory size in kilobytes recursively.
   */
  private async computeDirectorySizeKb(dirPath: string): Promise<number> {
    let totalBytes = 0;
    const walk = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            try {
              const stat = await fs.promises.stat(fullPath);
              totalBytes += stat.size;
            } catch {
              // Ignore file access race conditions during size calculations
            }
          }
        }
      } catch {
        // Ignore directory read errors
      }
    };
    await walk(dirPath);
    return Math.round(totalBytes / 1024);
  }
}
