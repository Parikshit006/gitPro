/**
 * Dashboard Repository (Raw Persistence Access Layer)
 *
 * Purpose:
 *   Owns every Prisma database query required by the Dashboard module.
 *   Responsible strictly for data retrieval from PostgreSQL.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, aggregation, or calculation.
 *   - Zero DTO mapping or formatting (returns raw Prisma persistence models).
 *   - Zero imports from dashboard.types.ts or Express.
 *   - Must import and use the shared PrismaClient singleton.
 */

import {
  Repository,
  MetricResult,
  Developer,
  FileNode,
  CommitNode,
  GraphEdge,
  CommitEvent,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class DashboardRepository {
  /**
   * Retrieves a single repository by its UUID from PostgreSQL.
   *
   * @param id UUID of the target repository.
   * @returns Raw Repository persistence model or null if not found.
   */
  async findRepositoryById(id: string): Promise<Repository | null> {
    try {
      return await prisma.repository.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve repository by id '${id}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a paginated list of repositories supporting optional filtering.
   *
   * @param skip Number of records to skip for pagination.
   * @param take Maximum number of records to return.
   * @param where Optional Prisma filtering clause.
   * @returns Array of raw Repository persistence models.
   */
  async findRepositories(
    skip?: number,
    take?: number,
    where?: Prisma.RepositoryWhereInput,
  ): Promise<Repository[]> {
    try {
      return await prisma.repository.findMany({
        where,
        skip: skip ?? 0,
        take: take ?? 50,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve repositories from PostgreSQL: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves raw metric calculation records for a repository, supporting
   * optional filtering by metric name, entity type, and entity ID.
   *
   * @param repositoryId UUID of the target repository.
   * @param metricName Optional filter for specific metric (e.g. 'bus-factor').
   * @param entityType Optional filter for entity type ('REPOSITORY', 'FILE', 'DEVELOPER').
   * @param entityId Optional filter for specific target ID (e.g. file path).
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw MetricResult persistence models.
   */
  async findMetricResults(
    repositoryId: string,
    metricName?: string,
    entityType?: string,
    entityId?: string,
    skip?: number,
    take?: number,
  ): Promise<MetricResult[]> {
    try {
      return await prisma.metricResult.findMany({
        where: {
          repositoryId,
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
        `Failed to retrieve metric results for repository '${repositoryId}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a paginated list of registered developers across workspaces.
   *
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @param where Optional Prisma filtering clause.
   * @returns Array of raw Developer persistence models.
   */
  async findDevelopers(
    skip?: number,
    take?: number,
    where?: Prisma.DeveloperWhereInput,
  ): Promise<Developer[]> {
    try {
      return await prisma.developer.findMany({
        where,
        skip: skip ?? 0,
        take: take ?? 50,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve developers from PostgreSQL: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves tracked repository file nodes with pagination support.
   *
   * @param repositoryId UUID of the target repository.
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw FileNode persistence models.
   */
  async findRepositoryFiles(
    repositoryId: string,
    skip?: number,
    take?: number,
  ): Promise<FileNode[]> {
    try {
      return await prisma.fileNode.findMany({
        where: { repositoryId },
        skip: skip ?? 0,
        take: take ?? 100,
        orderBy: { path: 'asc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve file nodes for repository '${repositoryId}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves recent raw commit events, optionally filtered by repository UUID.
   *
   * @param repositoryId Optional UUID of the target repository.
   * @param skip Number of records to skip.
   * @param take Maximum number of records to return.
   * @returns Array of raw CommitEvent persistence models.
   */
  async findRecentCommitEvents(
    repositoryId?: string,
    skip?: number,
    take?: number,
  ): Promise<CommitEvent[]> {
    try {
      return await prisma.commitEvent.findMany({
        where: repositoryId ? { repositoryId } : undefined,
        skip: skip ?? 0,
        take: take ?? 20,
        orderBy: { committedAt: 'desc' },
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve recent commit events: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves raw graph topology components (commit nodes, file nodes, and edges)
   * for a target repository using concurrent indexed queries.
   *
   * @param repositoryId UUID of the target repository.
   * @returns Composite object containing raw commitNodes, fileNodes, and graphEdges.
   */
  async findRepositoryGraph(repositoryId: string): Promise<{
    commitNodes: CommitNode[];
    fileNodes: FileNode[];
    graphEdges: GraphEdge[];
  }> {
    try {
      const [commitNodes, fileNodes, graphEdges] = await Promise.all([
        prisma.commitNode.findMany({ where: { repositoryId } }),
        prisma.fileNode.findMany({ where: { repositoryId } }),
        prisma.graphEdge.findMany({ where: { repositoryId } }),
      ]);

      return {
        commitNodes,
        fileNodes,
        graphEdges,
      };
    } catch (error: any) {
      throw new AppError(
        `Failed to retrieve repository graph for repository '${repositoryId}': ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
