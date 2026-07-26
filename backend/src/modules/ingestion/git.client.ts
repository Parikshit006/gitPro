/**
 * Git Client (simple-git wrapper)
 *
 * Purpose:
 *   Single responsibility: owns all interactions with the underlying simple-git
 *   library and Git CLI binaries. Encapsulates raw Git command execution behind
 *   a strongly-typed, asynchronous TypeScript interface.
 *
 * Why Git client interactions are isolated:
 *   Directly invoking simple-git across service layers couples business orchestration
 *   to a specific Git automation library. Isolating simple-git inside GitClient ensures
 *   that all Git commands (clone, fetch, checkout, revparse) follow consistent error
 *   handling, logging, and timeout policies. If Git automation needs to be replaced
 *   or upgraded, only this file is modified.
 *
 * Why no business logic or filesystem logic exists here:
 *   GitClient is a low-level infrastructure wrapper. It does not know about GitPro
 *   UUIDs, repository database models, or storage root hierarchies. It simply executes
 *   Git operations against provided target paths.
 */

import { spawn } from 'child_process';
import { Readable } from 'stream';
import simpleGit, { SimpleGit } from 'simple-git';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class GitClient {
  /**
   * Clones a remote repository to a target filesystem path.
   *
   * @param cloneUrl Remote Git URL (e.g., HTTPS clone URL).
   * @param targetPath Absolute local filesystem path where the repository should be cloned.
   * @param options Optional array of Git CLI flags (e.g., ['--no-tags', '--single-branch']).
   */
  async clone(cloneUrl: string, targetPath: string, options: string[] = []): Promise<void> {
    try {
      const git: SimpleGit = simpleGit();
      await git.clone(cloneUrl, targetPath, options);
    } catch (error: any) {
      throw new AppError(
        `Git clone failure: ${error?.message || 'Unknown git error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Fetches the latest refs and objects from the remote repository.
   *
   * @param repoPath Absolute local filesystem path of an existing repository.
   */
  async fetch(repoPath: string): Promise<void> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.fetch();
    } catch (error: any) {
      throw new AppError(
        `Git fetch failure: ${error?.message || 'Unknown git error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves the current HEAD commit hash (SHA-1/SHA-256) of the repository.
   *
   * @param repoPath Absolute local filesystem path of the repository.
   * @returns The commit hash string of the active HEAD.
   */
  async getCurrentHead(repoPath: string): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const sha = await git.revparse(['HEAD']);
      return sha.trim();
    } catch (error: any) {
      throw new AppError(
        `Failed to resolve Git HEAD: ${error?.message || 'Unknown git error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Checks out a specific branch, tag, or commit hash in the repository working tree.
   *
   * @param repoPath Absolute local filesystem path of the repository.
   * @param branchOrCommit Target ref name or commit hash to checkout.
   */
  async checkout(repoPath: string, branchOrCommit: string): Promise<void> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.checkout(branchOrCommit);
    } catch (error: any) {
      throw new AppError(
        `Git checkout failure for target '${branchOrCommit}': ${error?.message || 'Unknown git error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Checks whether the specified filesystem path is a valid Git repository directory.
   *
   * @param repoPath Absolute local filesystem path to inspect.
   * @returns True if the directory is recognized as a valid Git repo, false otherwise.
   */
  async isRepository(repoPath: string): Promise<boolean> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      return await git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /**
   * Retrieves the total commit count reachable from HEAD in the repository.
   *
   * @param repoPath Absolute local filesystem path of the repository.
   * @returns Total number of commits, or 0 if repository is empty or unborn.
   */
  async getCommitCount(repoPath: string): Promise<number> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const output = await git.raw(['rev-list', '--count', 'HEAD']);
      const count = parseInt(output.trim(), 10);
      return isNaN(count) ? 0 : count;
    } catch {
      return 0;
    }
  }

  /**
   * Retrieves the current HEAD commit hash (alias for getCurrentHead to match Phase 3 spec).
   *
   * @param repoPath Absolute local filesystem path of the repository.
   */
  async getHeadCommit(repoPath: string): Promise<string> {
    return await this.getCurrentHead(repoPath);
  }

  /**
   * Retrieves the currently active symbolic branch name (default branch after clone).
   *
   * @param repoPath Absolute local filesystem path of the repository.
   * @returns Branch name (e.g. 'main' or 'master').
   */
  async getDefaultBranch(repoPath: string): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      return branch.trim() || 'main';
    } catch {
      return 'main';
    }
  }

  /**
   * Streams raw git log records as a Node.js Readable stream.
   * Uses custom ASCII separators (\x1F field separator, \x1E record separator)
   * to ensure foolproof parsing without buffering history into memory.
   *
   * @param repoPath Absolute filesystem path of the repository.
   * @param oldHead Previously synced HEAD hash (null if initial sync).
   * @param newHead Currently active HEAD hash.
   * @returns Node.js Readable stream of stdout.
   */
  streamCommitLog(repoPath: string, oldHead: string | null, newHead: string): Readable {
    const formatString = '%H%x1f%P%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%B%x1e';
    const args = ['log', `--format=${formatString}`];

    if (oldHead && oldHead.trim() !== '' && oldHead.trim() !== newHead.trim()) {
      args.push(`${oldHead.trim()}..${newHead.trim()}`);
    } else if (!oldHead || oldHead.trim() === '') {
      args.push(newHead.trim());
    } else {
      // oldHead === newHead: empty range
      args.push('-0');
    }

    const child = spawn('git', args, { cwd: repoPath });

    child.on('error', (err) => {
      child.stdout.destroy(err);
    });

    return child.stdout;
  }
}
