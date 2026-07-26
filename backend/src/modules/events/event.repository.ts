/**
 * Event Repository (Raw Event Store Data Access)
 *
 * Purpose:
 *   Single responsibility: owns PostgreSQL database interactions for CommitEvent
 *   records via Prisma. Contains zero business logic or domain transformations.
 *
 * Why skipDuplicates is used for exactly-once persistence:
 *   When streaming commit events at high throughput, checking if a commit exists
 *   before inserting (`SELECT` then `INSERT`) introduces race conditions and doubles
 *   network round-trips. Using `createMany({ skipDuplicates: true })` translates
 *   directly to PostgreSQL `INSERT INTO ... ON CONFLICT (hash) DO NOTHING`.
 *   If a duplicate commit arrives, PostgreSQL ignores it silently without throwing
 *   exceptions or rolling back transactions.
 */

import { prisma } from '../../lib/prisma';
import { CommitEventRecordDto, EventPaginationOptions } from './event.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class EventRepository {
  /**
   * Persists a CommitEvent record in PostgreSQL.
   * Uses skipDuplicates (ON CONFLICT DO NOTHING) to ensure exactly-once
   * persistence without throwing errors on duplicate hashes.
   *
   * @param dto Persistence record DTO.
   * @returns True if inserted, false if ignored as a duplicate.
   */
  async save(dto: CommitEventRecordDto): Promise<boolean> {
    try {
      const result = await prisma.commitEvent.createMany({
        data: [
          {
            repositoryId: dto.repositoryId,
            hash: dto.hash,
            parentHashes: dto.parentHashes,
            authorName: dto.authorName,
            authorEmail: dto.authorEmail,
            authoredAt: dto.authoredAt,
            committedAt: dto.committedAt,
            message: dto.message,
            version: dto.version ?? 1,
          },
        ],
        skipDuplicates: true,
      });

      return result.count > 0;
    } catch (error: any) {
      throw new AppError(
        `Failed to save CommitEvent record to PostgreSQL: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Checks if a commit record already exists in the Raw Event Store by its hash.
   *
   * @param hash Cryptographically unique Git SHA.
   * @returns True if record exists, false otherwise.
   */
  async exists(hash: string): Promise<boolean> {
    try {
      const count = await prisma.commitEvent.count({
        where: { hash },
      });
      return count > 0;
    } catch {
      throw new AppError(
        'Failed to check CommitEvent existence in PostgreSQL',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a raw Prisma CommitEvent record by its unique hash.
   *
   * @param hash Cryptographically unique Git SHA.
   * @returns Raw record or null if not found.
   */
  async findByHash(hash: string): Promise<any | null> {
    try {
      return await prisma.commitEvent.findUnique({
        where: { hash },
      });
    } catch {
      throw new AppError(
        'Failed to query CommitEvent by hash from PostgreSQL',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a paginated list of raw CommitEvent records for a given repository,
   * ordered by commit timestamp descending (newest first).
   *
   * @param repositoryId UUID of the target repository.
   * @param options Pagination limits and offsets.
   * @returns Array of raw records.
   */
  async findByRepository(repositoryId: string, options: EventPaginationOptions = {}): Promise<any[]> {
    try {
      return await prisma.commitEvent.findMany({
        where: { repositoryId },
        orderBy: { committedAt: 'desc' },
        take: options.limit ?? 100,
        skip: options.offset ?? 0,
      });
    } catch {
      throw new AppError(
        'Failed to query CommitEvents by repository from PostgreSQL',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
