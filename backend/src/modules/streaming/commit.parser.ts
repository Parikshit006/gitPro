/**
 * Commit Parser (Raw Git Stream Transformer)
 *
 * Purpose:
 *   Consumes raw stdout data chunks from git log, splits records using ASCII
 *   Record Separators (\x1E), splits fields using ASCII Unit Separators (\x1F),
 *   and transforms them into immutable CommitEvent domain objects.
 *
 * Why custom ASCII delimiters and flow control are used:
 *   Standard line-by-line parsing breaks when commit messages contain newlines or
 *   special markdown symbols. Using non-printable ASCII control characters
 *   (0x1E and 0x1F) guarantees infallible record boundaries.
 *   Using Node.js async iteration (`for await`) naturally applies backpressure,
 *   preventing stream buffer bloat in RAM when downstream consumers take time
 *   to process events ($O(1)$ memory guaranteed).
 */

import { Readable } from 'stream';
import { CommitEvent } from './commit.event';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class CommitParser {
  /**
   * Reads chunks from a git log Readable stream using async iteration, extracts records via \x1E,
   * parses fields via \x1F, and invokes `onCommit` for each immutable event.
   *
   * @param stream Node.js Readable stream from child process stdout.
   * @param repositoryId UUID of the target repository.
   * @param onCommit Async or sync callback invoked for each parsed CommitEvent.
   * @returns Total number of commits parsed and streamed.
   */
  async parseStream(
    stream: Readable,
    repositoryId: string,
    onCommit: (event: CommitEvent) => Promise<void> | void,
  ): Promise<number> {
    let buffer = '';
    let count = 0;

    try {
      // Async iteration naturally handles stream flow control and backpressure without racing events
      for await (const chunk of stream) {
        buffer += chunk.toString('utf8');

        let recordEndIndex: number;
        while ((recordEndIndex = buffer.indexOf('\x1e')) !== -1) {
          const rawRecord = buffer.slice(0, recordEndIndex);
          // Garbage collect parsed string from buffer immediately to preserve O(1) RAM
          buffer = buffer.slice(recordEndIndex + 1);

          if (rawRecord.trim().length === 0) {
            continue;
          }

          const event = this.parseRecord(rawRecord, repositoryId);
          count++;
          await onCommit(event);
        }
      }

      return count;
    } catch (err: any) {
      stream.destroy(err);
      throw err instanceof AppError
        ? err
        : new AppError(
            `Commit log parsing error: ${err.message}`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            true,
          );
    }
  }

  /**
   * Converts a single raw delimited string record into an immutable CommitEvent.
   *
   * Expected format string: %H%x1f%P%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%B
   */
  private parseRecord(rawRecord: string, repositoryId: string): CommitEvent {
    const parts = rawRecord.split('\x1f');
    if (parts.length < 8) {
      throw new AppError(
        `Invalid git log record format. Expected at least 8 delimited fields, got ${parts.length}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    const hash = parts[0].trim();
    const parentsRaw = parts[1].trim();
    const parents = parentsRaw.length > 0 ? parentsRaw.split(/\s+/) : [];
    const authorName = parts[2].trim();
    const authorEmail = parts[3].trim();
    const authorDate = new Date(parts[4].trim() || Date.now());
    const committerName = parts[5].trim();
    const committerEmail = parts[6].trim();
    const committerDate = new Date(parts[7].trim() || Date.now());
    // All remaining parts belong to the commit message (subject + body)
    const message = parts.slice(8).join('\x1f').trim();

    return new CommitEvent({
      repositoryId,
      hash,
      parents,
      authorName,
      authorEmail,
      authorDate,
      committerName,
      committerEmail,
      committerDate,
      message,
    });
  }
}
