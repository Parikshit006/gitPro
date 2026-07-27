/**
 * Search Controller (HTTP Transport Boundary)
 *
 * Purpose:
 *   Converts HTTP search requests into SearchService calls and formats responses.
 */

import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';
import { SearchQuery, SearchEntityType, SortDirection } from './search.types';
import { ApiResponse } from '../../utils/ApiResponse';

export class SearchController {
  private readonly searchService: SearchService;

  constructor(searchService?: SearchService) {
    this.searchService = searchService ?? new SearchService();
  }

  getSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query.q ? String(req.query.q) : undefined;
      const type = req.query.type ? (String(req.query.type).toUpperCase() as SearchEntityType) : 'ALL';
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const pageSize = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : undefined;
      const sortOrder = req.query.sortOrder ? (String(req.query.sortOrder).toLowerCase() as SortDirection) : 'desc';

      const query: SearchQuery = {
        query: q,
        filter: {
          entityType: type,
          repositoryId: req.query.repositoryId ? String(req.query.repositoryId) : undefined,
          language: req.query.language ? String(req.query.language) : undefined,
          riskLevel: req.query.riskLevel ? String(req.query.riskLevel) : undefined,
        },
        sort: {
          field: sortBy,
          direction: sortOrder,
        },
        pagination: {
          page: isNaN(page) ? 1 : page,
          pageSize: isNaN(pageSize) ? 20 : pageSize,
        },
      };

      if (type === 'REPOSITORY') {
        const result = await this.searchService.searchRepositories(query);
        ApiResponse.success(res, 'Repositories retrieved successfully', result);
        return;
      }

      if (type === 'DEVELOPER') {
        const result = await this.searchService.searchDevelopers(query);
        ApiResponse.success(res, 'Developers retrieved successfully', result);
        return;
      }

      if (type === 'HOTSPOT') {
        const result = await this.searchService.searchHotspots(query);
        ApiResponse.success(res, 'Hotspots retrieved successfully', result);
        return;
      }

      if (type === 'OWNERSHIP') {
        const result = await this.searchService.searchOwnership(query);
        ApiResponse.success(res, 'Ownership retrieved successfully', result);
        return;
      }

      if (type === 'HEALTH') {
        const result = await this.searchService.searchHealth(query);
        ApiResponse.success(res, 'Health retrieved successfully', result);
        return;
      }

      if (type === 'INSIGHT') {
        const result = await this.searchService.searchInsights(query);
        ApiResponse.success(res, 'Insights retrieved successfully', result);
        return;
      }

      const result = await this.searchService.search(query);
      ApiResponse.success(res, 'Unified search executed successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
