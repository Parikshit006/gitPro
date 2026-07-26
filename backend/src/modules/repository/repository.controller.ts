/**
 * Repository Controller
 *
 * Purpose:
 *   The HTTP transport boundary for the Repository module. This controller
 *   translates incoming HTTP requests into calls to the RepositoryService
 *   and formats the result back into a standard ApiResponse.
 *
 * Why the controller contains no business logic:
 *   The controller's sole responsibility is to bridge HTTP and the service
 *   layer. It extracts data from the request, delegates to the service,
 *   and formats the response. URL validation, duplicate detection, and
 *   GitHub API calls are entirely the service's concern. This separation
 *   ensures the service can be invoked from background jobs, CLI tools,
 *   or other transports without modification.
 *
 * Why 201 Created is used for successful registration:
 *   HTTP 201 indicates that the request has been fulfilled and a new
 *   resource has been created. This is semantically correct for a POST
 *   endpoint that creates a new repository record. The response body
 *   contains the created resource.
 *
 * Why errors are forwarded to next():
 *   Express's centralized error middleware handles all error formatting
 *   and status code mapping. By forwarding errors via next(), the
 *   controller avoids duplicating error response logic and ensures
 *   consistent error formatting across all endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { RepositoryService } from './repository.service';
import { RepositorySyncService } from '../synchronization/sync.service';
import { RegisterRepositoryRequest } from './repository.types';
import { ApiResponse } from '../../utils/ApiResponse';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { AppError } from '../../errors/AppError';

// Note: Future refactoring will transition to dependency injection for controllers
const repositoryService = new RepositoryService();
const repositorySyncService = new RepositorySyncService();

export class RepositoryController {
  /**
   * Handles POST /api/v1/repositories
   *
   * Accepts a JSON body with a GitHub repository URL, delegates
   * registration to the service layer, and returns the created
   * repository with a 201 status code.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.body as RegisterRepositoryRequest;

      if (!url) {
        throw new AppError(
          'Request body must include a "url" field',
          HTTP_STATUS.BAD_REQUEST,
          true,
        );
      }

      const repository = await repositoryService.registerRepository(url);

      ApiResponse.success(res, 'Repository registered successfully', repository, HTTP_STATUS.CREATED);
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
