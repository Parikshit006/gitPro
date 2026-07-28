/**
 * Dashboard Controller (HTTP Transport Boundary)
 *
 * Purpose:
 *   The HTTP transport boundary for the Dashboard module.
 *   Translates incoming HTTP GET requests into calls to DashboardService,
 *   validates route and query parameters, and wraps return DTOs in ApiResponse.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero business logic, metric calculations, or DTO mapping.
 *   - Zero direct repository queries.
 *   - Must validate repositoryId parameters and pagination/filtering queries.
 *   - Must throw AppError(400) on invalid input and forward errors to next().
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { AppError } from '../../errors/AppError';

export class DashboardController {
  private readonly service: DashboardService;

  constructor(service?: DashboardService) {
    this.service = service ?? new DashboardService();
  }

  /**
   * GET /dashboard
   * Retrieves the executive organizational engineering overview.
   */
  getDashboardOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getDashboardOverview();
      ApiResponse.success(res, 'Dashboard overview retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories
   * Retrieves a paginated list of summarized repository cards.
   */
  getRepositories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { skip, take } = this.extractPagination(req);
      const data = await this.service.getRepositories(skip, take);
      ApiResponse.success(res, 'Repositories retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id
   * GET /repositories/:id/overview
   * Retrieves the complete deep-dive report for a selected repository.
   */
  getRepositoryOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryOverview(repositoryId);
      ApiResponse.success(res, 'Repository overview retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/health
   * Retrieves the synthesized RepositoryHealth scorecard index.
   */
  getRepositoryHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryHealth(repositoryId);
      ApiResponse.success(res, 'Repository health retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/activity
   * Retrieves temporal contribution trends and development throughput metrics.
   */
  getRepositoryActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryActivity(repositoryId);
      ApiResponse.success(res, 'Repository activity retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/hotspots
   * Retrieves ranked HotspotSummary DTOs.
   */
  getRepositoryHotspots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryHotspots(repositoryId);
      ApiResponse.success(res, 'Repository hotspots retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/ownership
   * Retrieves file-level maintainer attribution and code responsibility breakdown.
   */
  getRepositoryOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryOwnership(repositoryId);
      ApiResponse.success(res, 'Repository ownership retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/bus-factor
   * Retrieves the maintainer concentration risk BusFactorSummary DTO.
   */
  getRepositoryBusFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryBusFactor(repositoryId);
      ApiResponse.success(res, 'Repository bus factor retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/developers
   * Retrieves developer graph nodes for ownership and contribution analysis.
   */
  getRepositoryDevelopers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryDevelopers(repositoryId);
      ApiResponse.success(res, 'Repository developers retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /repositories/:id/insights
   * Retrieves comprehensive AI engineering insights for the repository.
   */
  getRepositoryInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repositoryId = this.validateRepositoryId(req.params.id);
      const data = await this.service.getRepositoryInsights(repositoryId);
      ApiResponse.success(res, 'Repository insights retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Private Helper & Validation Layer (Transport Parameter Checks Only)
  // ============================================================================

  private validateRepositoryId(id: string | undefined): string {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new AppError('Invalid repositoryId parameter', HTTP_STATUS.BAD_REQUEST, true);
    }
    return id.trim();
  }

  private extractPagination(req: Request): { skip: number; take: number } {
    const skipParam = req.query.skip ?? req.query.offset;
    const takeParam = req.query.take ?? req.query.limit;

    const skip = skipParam !== undefined ? Number(skipParam) : 0;
    const take = takeParam !== undefined ? Number(takeParam) : 50;

    if (isNaN(skip) || skip < 0 || isNaN(take) || take <= 0) {
      throw new AppError('Invalid pagination parameters', HTTP_STATUS.BAD_REQUEST, true);
    }

    return { skip, take };
  }
}
