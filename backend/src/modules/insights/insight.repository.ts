/**
 * Insight Repository (Persistence Retrieval Boundary)
 *
 * Purpose:
 *   The dedicated persistence access layer for the GitPro Engineering Insights module.
 *   Responsible strictly for querying and retrieving precomputed engineering metrics,
 *   repository metadata, commit events, and developer topology from PostgreSQL.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, calculations, or metric recalculations.
 *   - Zero DTO mapping or formatting (strictly returns raw Prisma persistence models).
 *   - Zero risk evaluation or recommendation checklist generation.
 *   - Must import and use the shared PrismaClient singleton (@prisma/client instantiation is forbidden).
 *   - Must leverage concurrent execution (Promise.all) for independent dataset retrievals.
 */

import {
  Repository,
  MetricResult,
  Developer,
  CommitEvent,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class InsightRepository {
  /**
   * Retrieves a single repository by its UUID from PostgreSQL.
   *
   * @param repositoryId UUID of the target repository.
   * @returns Raw Repository persistence model or null if not found.
   */
  async findRepository(repositoryId: string): Promise<Repository | null> {
    try {
      return await prisma.repository.findUnique({
        where: { id: repositoryId },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve repository '${repositoryId}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a paginated list of all tracked repositories from PostgreSQL.
   *
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw Repository persistence models.
   */
  async findRepositories(skip?: number, take?: number): Promise<Repository[]> {
    try {
      return await prisma.repository.findMany({
        skip: skip ?? 0,
        take: take ?? 50,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve repositories: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves raw metric calculation records, supporting optional scoping
   * by repositoryId, metric name, entity type, and entity ID with pagination.
   *
   * @param repositoryId Optional UUID of the target repository.
   * @param metricName Optional filter for specific metric (e.g., 'bus-factor', 'hotspot').
   * @param entityType Optional filter for entity type ('REPOSITORY', 'FILE', 'DEVELOPER').
   * @param entityId Optional filter for specific target ID (e.g., file path or author UUID).
   * @param skip Number of records to skip for pagination.
   * @param take Maximum number of records to return.
   * @returns Array of raw MetricResult persistence models.
   */
  async findMetricResults(
    repositoryId?: string,
    metricName?: string,
    entityType?: string,
    entityId?: string,
    skip?: number,
    take?: number,
  ): Promise<MetricResult[]> {
    try {
      return await prisma.metricResult.findMany({
        where: {
          ...(repositoryId ? { repositoryId } : {}),
          ...(metricName ? { metricName } : {}),
          ...(entityType ? { entityType } : {}),
          ...(entityId ? { entityId } : {}),
        },
        skip: skip ?? 0,
        take: take ?? 100,
        orderBy: { calculatedAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve metric results: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves registered developer models. If repositoryId is provided, queries
   * developers who authored commits within that specific repository.
   *
   * @param repositoryId Optional UUID of the repository to scope developer lookups.
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw Developer persistence models.
   */
  async findDevelopers(
    repositoryId?: string,
    skip?: number,
    take?: number,
  ): Promise<Developer[]> {
    try {
      if (repositoryId) {
        // Query distinct contributor emails from indexed CommitEvent table
        const commits = await prisma.commitEvent.findMany({
          where: { repositoryId },
          select: { authorEmail: true },
          distinct: ['authorEmail'],
        });
        const emails = commits.map((c) => c.authorEmail);

        return await prisma.developer.findMany({
          where: { email: { in: emails } },
          skip: skip ?? 0,
          take: take ?? 50,
          orderBy: { createdAt: 'desc' },
        });
      }

      return await prisma.developer.findMany({
        skip: skip ?? 0,
        take: take ?? 50,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve developers: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves raw commit events for a target repository with pagination support.
   *
   * @param repositoryId UUID of the target repository.
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw CommitEvent persistence models.
   */
  async findCommitEvents(
    repositoryId: string,
    skip?: number,
    take?: number,
  ): Promise<CommitEvent[]> {
    try {
      return await prisma.commitEvent.findMany({
        where: { repositoryId },
        skip: skip ?? 0,
        take: take ?? 100,
        orderBy: { committedAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve commit events for repository '${repositoryId}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed file hotspot calculation records.
   *
   * @param repositoryId Optional UUID of the target repository.
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw MetricResult persistence models for hotspots.
   */
  async findHotspots(
    repositoryId?: string,
    skip?: number,
    take?: number,
  ): Promise<MetricResult[]> {
    return this.findMetricResults(repositoryId, 'hotspot', undefined, undefined, skip, take);
  }

  /**
   * Retrieves precomputed code ownership calculation records.
   *
   * @param repositoryId Optional UUID of the target repository.
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw MetricResult persistence models for ownership.
   */
  async findOwnership(
    repositoryId?: string,
    skip?: number,
    take?: number,
  ): Promise<MetricResult[]> {
    return this.findMetricResults(repositoryId, 'ownership', undefined, undefined, skip, take);
  }

  /**
   * Retrieves precomputed bus factor calculation records.
   *
   * @param repositoryId Optional UUID of the target repository.
   * @returns Array of raw MetricResult persistence models for bus factor.
   */
  async findBusFactor(repositoryId?: string): Promise<MetricResult[]> {
    return this.findMetricResults(repositoryId, 'bus-factor');
  }

  /**
   * Concurrently loads all independent persistence datasets required to generate
   * a complete, consolidated RepositoryInsight report.
   *
   * @param repositoryId UUID of the target repository.
   * @returns Composite object containing raw repository, metrics, commits, and developers.
   */
  async findRepositorySummary(repositoryId: string): Promise<{
    repository: Repository | null;
    busFactorMetrics: MetricResult[];
    ownershipMetrics: MetricResult[];
    hotspotMetrics: MetricResult[];
    recentCommits: CommitEvent[];
    developers: Developer[];
  }> {
    try {
      const [
        repository,
        busFactorMetrics,
        ownershipMetrics,
        hotspotMetrics,
        recentCommits,
        developers,
      ] = await Promise.all([
        this.findRepository(repositoryId),
        this.findBusFactor(repositoryId),
        this.findOwnership(repositoryId),
        this.findHotspots(repositoryId),
        this.findCommitEvents(repositoryId, 0, 50),
        this.findDevelopers(repositoryId, 0, 50),
      ]);

      return {
        repository,
        busFactorMetrics,
        ownershipMetrics,
        hotspotMetrics,
        recentCommits,
        developers,
      };
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve consolidated summary for repository '${repositoryId}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
