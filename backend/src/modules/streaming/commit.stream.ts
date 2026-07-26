/**
 * Commit Stream Service (Streaming Orchestrator)
 *
 * Purpose:
 *   Orchestrates constant-memory streaming of Git commit history for a specified
 *   CommitWindow. Connects raw filesystem Git streams to domain parsers and
 *   in-process event publishers without ever accumulating commit arrays or
 *   building in-memory graphs.
 *
 * Why this service enforces strict streaming boundaries:
 *   By delegating parsing to CommitParser and distribution to CommitEventPublisher,
 *   CommitStreamService operates as a pure pipeline coordinator. It guarantees
 *   that 10 commits or 100,000 commits consume identical memory resources ($O(1)$).
 */

import { StorageService } from '../ingestion/storage.service';
import { GitClient } from '../ingestion/git.client';
import { CommitParser } from './commit.parser';
import { CommitEventPublisher } from './event.publisher';
import { CommitWindow, CommitStreamSummary } from './commit.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class CommitStreamService {
  private readonly storageService: StorageService;
  private readonly gitClient: GitClient;
  private readonly parser: CommitParser;
  private readonly publisher: CommitEventPublisher;

  constructor(publisher: CommitEventPublisher) {
    this.storageService = new StorageService();
    this.gitClient = new GitClient();
    this.parser = new CommitParser();
    this.publisher = publisher;
  }

  /**
   * Streams commit history for a given commit window, converting git log records
   * into immutable CommitEvents and publishing them to subscribers in O(1) memory.
   *
   * @param window The commit window specifying repositoryId, oldHead, and newHead.
   * @returns Summary statistics of the stream execution.
   */
  async streamCommits(window: CommitWindow): Promise<CommitStreamSummary> {
    const startTime = new Date();
    const repoPath = this.storageService.getRepositoryPath(window.repositoryId);

    try {
      const readableStream = this.gitClient.streamCommitLog(
        repoPath,
        window.oldHead,
        window.newHead,
      );

      const totalStreamed = await this.parser.parseStream(
        readableStream,
        window.repositoryId,
        async (event) => {
          await this.publisher.publish(event);
        },
      );

      const endTime = new Date();
      return {
        repositoryId: window.repositoryId,
        totalStreamed,
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
      };
    } catch (error: any) {
      throw error instanceof AppError
        ? error
        : new AppError(
            `Commit streaming failed for repo ${window.repositoryId}: ${error?.message || 'Unknown error'}`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            true,
          );
    }
  }
}
