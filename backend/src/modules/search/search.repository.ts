/**
 * Search Repository (Unified Retrieval Facade)
 *
 * Purpose:
 *   The retrieval boundary for GitPro's unified Search module.
 *   Strictly delegates data gathering to existing domain repositories
 *   (DashboardRepository, InsightRepository, MetricRepository, and RepositoryRepository)
 *   without introducing direct database queries or schema dependencies.
 *
 * Strict Architectural Rules:
 *   - Only retrieval: zero business logic, zero orchestration, zero DTO mapping.
 *   - Zero Git access, zero graph traversals, zero metric calculations.
 *   - Must consume ONLY existing Repository, Dashboard, Metrics, and Insight repositories.
 */

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { InsightRepository } from '../insights/insight.repository';
import { MetricRepository } from '../metrics/metric.repository';
import { RepositoryRepository } from '../repository/repository.repository';
import { Repository as PrismaRepository, MetricResult, Developer } from '@prisma/client';
import { Repository as DomainRepository } from '../repository/repository.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class SearchRepository {
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
   * Retrieves tracked repositories from the Dashboard repository.
   */
  async getRepositories(skip?: number, take?: number): Promise<PrismaRepository[]> {
    try {
      return await this.dashboardRepo.findRepositories(skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for repositories: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a single repository by UUID using the core Repository repository.
   */
  async getRepositoryById(id: string): Promise<DomainRepository | null> {
    try {
      return await this.repositoryRepo.findById(id);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for repository id '${id}': ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves developers from the Insight repository with optional repository scoping.
   */
  async getDevelopers(repositoryId?: string, skip?: number, take?: number): Promise<Developer[]> {
    try {
      return await this.insightRepo.findDevelopers(repositoryId, skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for developers: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed file hotspot metrics from the Insight repository.
   */
  async getHotspots(repositoryId?: string, skip?: number, take?: number): Promise<MetricResult[]> {
    try {
      return await this.insightRepo.findHotspots(repositoryId, skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for hotspots: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed file ownership metrics from the Insight repository.
   */
  async getOwnership(repositoryId?: string, skip?: number, take?: number): Promise<MetricResult[]> {
    try {
      return await this.insightRepo.findOwnership(repositoryId, skip, take);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for ownership: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves precomputed bus factor metrics from the Insight repository.
   */
  async getBusFactor(repositoryId?: string): Promise<MetricResult[]> {
    try {
      return await this.insightRepo.findBusFactor(repositoryId);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for bus factor: ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves a consolidated repository dataset from the Insight repository for health/insight evaluation.
   */
  async getRepositorySummary(repositoryId: string) {
    try {
      return await this.insightRepo.findRepositorySummary(repositoryId);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Search retrieval failed for repository summary '${repositoryId}': ${err.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
