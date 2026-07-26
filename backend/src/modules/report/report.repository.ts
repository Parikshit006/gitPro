/**
 * Report Repository (Data Access & Retrieval Boundary)
 *
 * Purpose:
 *   Owns all persistence interactions required by the reporting platform.
 *   Uses existing domain repositories (DashboardRepository, InsightRepository,
 *   MetricRepository, RepositoryRepository) to gather historical and evaluated data
 *   without executing ad-hoc database queries or performing calculations/formatting.
 *
 * Strict Architectural Rules:
 *   - Only persistence retrieval: zero metric calculations, zero DTO formatting, zero PDF generation.
 *   - Uses existing repositories where possible. Never access Git or Graph directly.
 */

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { InsightRepository } from '../insights/insight.repository';
import { MetricRepository } from '../metrics/metric.repository';
import { RepositoryRepository } from '../repository/repository.repository';
import { Repository as PrismaRepository, MetricResult, Developer } from '@prisma/client';
import { Repository as DomainRepository } from '../repository/repository.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class ReportRepository {
  private readonly dashboardRepo: DashboardRepository;
  private readonly insightRepo: InsightRepository;
  private readonly metricRepo: MetricRepository;
  private readonly repositoryRepo: RepositoryRepository;

  constructor(
    dashboardRepo?: DashboardRepository,
    insightRepo?: InsightRepository,
    metricRepo?: MetricRepository,
    repositoryRepo?: RepositoryRepository,
  ) {
    this.dashboardRepo = dashboardRepo ?? new DashboardRepository();
    this.insightRepo = insightRepo ?? new InsightRepository();
    this.metricRepo = metricRepo ?? new MetricRepository();
    this.repositoryRepo = repositoryRepo ?? new RepositoryRepository();
  }

  /**
   * Retrieves all tracked repositories for organization and executive reports.
   */
  async getRepositories(skip = 0, take = 100): Promise<PrismaRepository[]> {
    try {
      return await this.dashboardRepo.findRepositories(skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for repositories: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a specific repository by UUID.
   */
  async getRepositoryById(id: string): Promise<DomainRepository | null> {
    try {
      return await this.repositoryRepo.findById(id);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for repository id '${id}': ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves developers across repositories or scoped to a specific repository.
   */
  async getDevelopers(repositoryId?: string, skip = 0, take = 100): Promise<Developer[]> {
    try {
      return await this.insightRepo.findDevelopers(repositoryId, skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for developers: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed file hotspot metrics.
   */
  async getHotspots(repositoryId?: string, skip = 0, take = 50): Promise<MetricResult[]> {
    try {
      return await this.insightRepo.findHotspots(repositoryId, skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for hotspots: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed code ownership metrics.
   */
  async getOwnership(repositoryId?: string, skip = 0, take = 50): Promise<MetricResult[]> {
    try {
      return await this.insightRepo.findOwnership(repositoryId, skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for ownership: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed bus factor metrics.
   */
  async getBusFactor(repositoryId?: string): Promise<MetricResult[]> {
    try {
      return await this.insightRepo.findBusFactor(repositoryId);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for bus factor: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves consolidated repository dataset from the Insight repository.
   */
  async getRepositorySummary(repositoryId: string) {
    try {
      return await this.insightRepo.findRepositorySummary(repositoryId);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Report retrieval failed for repository summary '${repositoryId}': ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
