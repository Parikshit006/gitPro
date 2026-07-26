/**
 * Storage Service (Filesystem & Path Management)
 *
 * Purpose:
 *   Responsible exclusively for determining repository filesystem paths,
 *   creating storage folder hierarchies, and managing physical disk cleanup
 *   for cloned Git repositories.
 *
 * Why UUIDs are used for folder naming instead of repository names:
 *   GitHub repository names (e.g., "react") or full names ("facebook/react")
 *   can contain slashes, special characters, or be renamed over time. If a
 *   user registers two repos with the same name from different organizations,
 *   or if a repository is renamed on GitHub, name-based directories cause
 *   path collisions or broken references. Using the GitPro internal UUID
 *   guarantees uniqueness, immutable directory names, and safe filesystem paths.
 *
 * Why storage path determination is isolated:
 *   By concentrating all filesystem path calculations in StorageService, other
 *   layers (CloneService, GitClient, future mining engines) never construct
 *   paths manually or hardcode directory structures. This makes the storage
 *   layout completely modular and easy to mock in unit tests.
 */

import fs from 'fs';
import path from 'path';
import config from '../../config';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class StorageService {
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = config.ingestion.storageRoot;
  }

  /**
   * Returns the absolute filesystem path for a repository's clone directory.
   *
   * @param repoId Internal UUID of the repository.
   */
  getRepositoryPath(repoId: string): string {
    if (!repoId) {
      throw new AppError('Repository ID is required to resolve storage path', HTTP_STATUS.BAD_REQUEST, true);
    }
    return path.join(this.storageRoot, repoId);
  }

  /**
   * Returns the absolute path to the repository's internal Git database directory (.git).
   *
   * @param repoId Internal UUID of the repository.
   */
  getGitDbPath(repoId: string): string {
    return path.join(this.getRepositoryPath(repoId), '.git');
  }

  /**
   * Returns the absolute path to the repository's HEAD reference file (.git/HEAD).
   *
   * @param repoId Internal UUID of the repository.
   */
  getHeadPath(repoId: string): string {
    return path.join(this.getGitDbPath(repoId), 'HEAD');
  }

  /**
   * Ensures that the storage root and target repository folder exist on disk.
   * Creates directory hierarchy recursively if missing.
   *
   * @param repoId Internal UUID of the repository.
   * @returns The absolute path to the repository directory.
   */
  async ensureStorageDirectory(repoId: string): Promise<string> {
    const targetPath = this.getRepositoryPath(repoId);
    try {
      await fs.promises.mkdir(targetPath, { recursive: true });
      return targetPath;
    } catch {
      throw new AppError(
        `Filesystem error: Unable to create storage directory for repository ${repoId}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Verifies whether the target repository directory exists on disk.
   *
   * @param repoId Internal UUID of the repository.
   */
  async repositoryStorageExists(repoId: string): Promise<boolean> {
    const targetPath = this.getRepositoryPath(repoId);
    try {
      const stats = await fs.promises.stat(targetPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Deletes a repository's physical storage directory recursively from disk.
   * Used for cleanup when an initial clone fails or a repository is removed.
   *
   * @param repoId Internal UUID of the repository.
   */
  async deleteRepositoryStorage(repoId: string): Promise<void> {
    const targetPath = this.getRepositoryPath(repoId);
    try {
      const exists = await this.repositoryStorageExists(repoId);
      if (exists) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`[STORAGE CLEANUP FAILED] Could not delete directory ${targetPath}:`, error);
    }
  }
}
