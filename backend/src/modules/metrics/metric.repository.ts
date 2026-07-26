/**
 * Metric Repository (Persistence & Snapshot Replacement Layer)
 *
 * Purpose:
 *   Owns PostgreSQL database interactions for calculated engineering metrics
 *   via Prisma. Contains zero analytical calculation logic.
 *
 * Why transactional snapshot replacement is used:
 *   When re-running metrics (e.g. Bus Factor or Ownership) on an updated repository,
 *   simply appending new records causes unbounded table bloat and ambiguous queries.
 *   MetricRepository uses a database transaction to cleanly delete the previous
 *   snapshot for each (repositoryId, metricName) pair before inserting the new
 *   calculations in bulk via createMany. This guarantees 100% idempotent execution.
 */

import { prisma } from '../../lib/prisma';
import { MetricResultDto } from './metric.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class MetricRepository {
  /**
   * Persists an array of MetricResult calculations in PostgreSQL.
   * Replaces previous calculation snapshots for the affected (repositoryId, metricName)
   * pairs atomically within a database transaction.
   *
   * @param results Array of calculated MetricResult DTOs.
   * @returns Number of newly inserted records.
   */
  async saveMany(results: MetricResultDto[]): Promise<number> {
    if (results.length === 0) return 0;

    const pairs = new Map<string, { repositoryId: string; metricName: string }>();
    for (const r of results) {
      pairs.set(`${r.repositoryId}:${r.metricName}`, { repositoryId: r.repositoryId, metricName: r.metricName });
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Remove previous calculation snapshots for the affected metrics
        for (const pair of pairs.values()) {
          await tx.metricResult.deleteMany({
            where: {
              repositoryId: pair.repositoryId,
              metricName: pair.metricName,
            },
          });
        }

        const createRes = await tx.metricResult.createMany({
          data: results.map((r) => ({
            repositoryId: r.repositoryId,
            metricName: r.metricName,
            entityType: r.entityType,
            entityId: r.entityId,
            score: r.score,
            metadata: r.metadata ?? undefined,
          })),
        });

        return createRes.count;
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to persist MetricResults to PostgreSQL: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves stored metric calculation results for a repository, optionally
   * filtered by a specific metric name.
   *
   * @param repositoryId UUID of target repository.
   * @param metricName Optional filter (e.g., 'bus-factor', 'ownership').
   * @returns Array of stored metric records ordered by score descending.
   */
  async findByRepository(repositoryId: string, metricName?: string): Promise<any[]> {
    try {
      return await prisma.metricResult.findMany({
        where: {
          repositoryId,
          ...(metricName ? { metricName } : {}),
        },
        orderBy: { score: 'desc' },
      });
    } catch {
      throw new AppError(
        'Failed to query MetricResults by repository from PostgreSQL',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves stored metric calculations targeting a specific entity
   * (e.g. all metrics for a specific file path or developer email).
   *
   * @param repositoryId UUID of target repository.
   * @param entityType Entity classification ('REPOSITORY', 'FILE', 'DEVELOPER').
   * @param entityId Entity identifier (file path, email, or repository ID).
   * @returns Array of matching metric records.
   */
  async findByEntity(repositoryId: string, entityType: string, entityId: string): Promise<any[]> {
    try {
      return await prisma.metricResult.findMany({
        where: { repositoryId, entityType, entityId },
        orderBy: { metricName: 'asc' },
      });
    } catch {
      throw new AppError(
        'Failed to query MetricResults by entity from PostgreSQL',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
