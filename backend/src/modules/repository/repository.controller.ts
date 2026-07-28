/**
 * Repository Controller
 *
 * Purpose:
 *   The HTTP transport boundary for the Repository module.
 *
 * Endpoints:
 *   GET  /         — List all registered repositories
 *   POST /         — Register a new repository by clone URL
 *   GET  /:id      — Get a single repository by internal UUID
 *   POST /:id/sync — Trigger clone / re-sync
 *   GET  /:id/health — File system health check
 */

import { Request, Response, NextFunction } from 'express';
import { RepositoryService } from './repository.service';
import { RepositorySyncService } from '../synchronization/sync.service';
import { RegisterRepositoryRequest } from './repository.types';
import { ApiResponse } from '../../utils/ApiResponse';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { AppError } from '../../errors/AppError';

const repositoryService = new RepositoryService();
const repositorySyncService = new RepositorySyncService();

export class RepositoryController {
  /**
   * GET /api/v1/repositories
   * Returns all registered repositories for this GitPro instance.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const repositories = await repositoryService.listRepositories();
      ApiResponse.success(res, 'Repositories retrieved successfully', repositories, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/repositories
   * Accepts a JSON body with a GitHub repository URL, registers it, and returns the record.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url, cloneUrl } = req.body as RegisterRepositoryRequest & { cloneUrl?: string };
      const repositoryUrl = url || cloneUrl;

      if (!repositoryUrl) {
        throw new AppError(
          'Request body must include a "url" field with the GitHub repository URL',
          HTTP_STATUS.BAD_REQUEST,
          true,
        );
      }

      const repository = await repositoryService.registerRepository(repositoryUrl);
      ApiResponse.success(res, 'Repository registered successfully', repository, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/repositories/:id
   * Returns a single repository by its internal UUID.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new AppError('Repository ID is required', HTTP_STATUS.BAD_REQUEST, true);
      }

      const repository = await repositoryService.getRepository(id);
      ApiResponse.success(res, 'Repository retrieved successfully', repository, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/repositories/:id/sync
   * Triggers synchronous repository cloning or fetching from GitHub.
   */
  async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new AppError('Repository ID is required', HTTP_STATUS.BAD_REQUEST, true);
      }

      const result = await repositorySyncService.syncRepository(id);
      ApiResponse.success(res, 'Repository synchronized successfully', result, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/repositories/:id/health
   * Inspects filesystem health of a cached repository on disk.
   */
  async health(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new AppError('Repository ID is required', HTTP_STATUS.BAD_REQUEST, true);
      }

      const healthStatus = await repositorySyncService.verifyRepositoryHealth(id);
      ApiResponse.success(res, 'Repository health verified', healthStatus, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const repositoryController = new RepositoryController();
