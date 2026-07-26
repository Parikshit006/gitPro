/**
 * Search Service (Unified Orchestration Engine)
 *
 * Purpose:
 *   Orchestrates search queries across Repository, Developer, Health, Hotspot, Ownership,
 *   and Insight domains. Coordinates retrieval via SearchRepository and insight evaluation
 *   via InsightService, applying in-memory keyword filtering, multi-dimensional filtering,
 *   directional sorting, and slicing pagination.
 *
 * Strict Architectural Rules:
 *   - Only orchestration: zero direct database access, zero Prisma queries, zero git access.
 *   - Delegates data retrieval to SearchRepository and DTO mapping to SearchMapper.
 */

import { SearchRepository } from './search.repository';
import { SearchMapper } from './search.mapper';
import {
  SearchQuery,
  UnifiedSearchResponse,
  RepositorySearchResult,
  DeveloperSearchResult,
  HotspotSearchResult,
  OwnershipSearchResult,
  HealthSearchResult,
  InsightSearchResult,
  PaginationMetadata,
} from './search.types';
import { InsightService } from '../insights/insight.service';

export class SearchService {
  private readonly searchRepo: SearchRepository;
  private readonly insightService: InsightService;

  constructor(searchRepo?: SearchRepository, insightService?: InsightService) {
    this.searchRepo = searchRepo ?? new SearchRepository();
    this.insightService = insightService ?? new InsightService();
  }

  /**
   * Helper to perform case-insensitive keyword substring matching across target strings.
   */
  private matchesKeyword(keyword: string | undefined, ...fields: Array<string | undefined>): boolean {
    if (!keyword || keyword.trim() === '') return true;
    const lower = keyword.trim().toLowerCase();
    return fields.some((f) => f && f.toLowerCase().includes(lower));
  }

  /**
   * Helper to slice arrays for pagination and generate pagination metadata.
   */
  private paginate<T>(items: ReadonlyArray<T>, page = 1, pageSize = 20): { sliced: T[]; pagination: PaginationMetadata } {
    const p = Math.max(1, page);
    const size = Math.max(1, pageSize);
    const start = (p - 1) * size;
    const sliced = items.slice(start, start + size);
    const pagination = SearchMapper.buildPaginationMetadata(items.length, p, size);
    return { sliced, pagination };
  }

  /**
   * Helper to perform directional sorting without using 'any'.
   */
  private sortItems<T>(items: T[], field?: string, direction?: 'asc' | 'desc'): void {
    if (!field) return;
    const dir = direction === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      const valA = (a as Record<string, unknown>)[field];
      const valB = (b as Record<string, unknown>)[field];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  }

  /**
   * Searches tracked repositories with keyword matching, filtering, sorting, and pagination.
   */
  async searchRepositories(query: SearchQuery): Promise<{ results: RepositorySearchResult[]; pagination: PaginationMetadata }> {
    const rawRepos = await this.searchRepo.getRepositories(0, 500);
    let mapped = rawRepos.map((r) => SearchMapper.toRepositorySearchResult(r));

    if (query.query) {
      mapped = mapped.filter((r) => this.matchesKeyword(query.query, r.name, r.owner, r.fullName, r.description));
    }
    if (query.filter?.repositoryId) {
      mapped = mapped.filter((r) => r.id === query.filter?.repositoryId);
    }
    if (query.filter?.language) {
      mapped = mapped.filter((r) => r.language && r.language.toLowerCase() === query.filter?.language?.toLowerCase());
    }

    if (query.sort?.field) {
      this.sortItems(mapped, query.sort.field, query.sort.direction);
    }

    const { sliced, pagination } = this.paginate(mapped, query.pagination?.page, query.pagination?.pageSize);
    return { results: sliced, pagination };
  }

  /**
   * Searches registered contributors and developers across workspaces.
   */
  async searchDevelopers(query: SearchQuery): Promise<{ results: DeveloperSearchResult[]; pagination: PaginationMetadata }> {
    const rawDevs = await this.searchRepo.getDevelopers(query.filter?.repositoryId, 0, 500);
    let mapped = rawDevs.map((d) => SearchMapper.toDeveloperSearchResult(d));

    if (query.query) {
      mapped = mapped.filter((d) => this.matchesKeyword(query.query, d.email, d.name));
    }
    if (query.filter?.authorEmail) {
      mapped = mapped.filter((d) => d.email.toLowerCase() === query.filter?.authorEmail?.toLowerCase());
    }

    if (query.sort?.field) {
      this.sortItems(mapped, query.sort.field, query.sort.direction);
    }

    const { sliced, pagination } = this.paginate(mapped, query.pagination?.page, query.pagination?.pageSize);
    return { results: sliced, pagination };
  }

  /**
   * Searches high-churn code hotspots across repositories.
   */
  async searchHotspots(query: SearchQuery): Promise<{ results: HotspotSearchResult[]; pagination: PaginationMetadata }> {
    const rawHotspots = await this.searchRepo.getHotspots(query.filter?.repositoryId, 0, 500);
    let mapped = rawHotspots.map((m) => SearchMapper.toHotspotSearchResult(m));

    if (query.query) {
      mapped = mapped.filter((h) => this.matchesKeyword(query.query, h.filePath));
    }
    if (query.filter?.repositoryId) {
      mapped = mapped.filter((h) => h.repositoryId === query.filter?.repositoryId);
    }
    if (query.filter?.minScore !== undefined) {
      const min = query.filter.minScore;
      mapped = mapped.filter((h) => h.modificationsCount >= min);
    }
    if (query.filter?.maxScore !== undefined) {
      const max = query.filter.maxScore;
      mapped = mapped.filter((h) => h.modificationsCount <= max);
    }

    if (query.sort?.field) {
      this.sortItems(mapped, query.sort.field, query.sort.direction);
    } else {
      mapped.sort((a, b) => b.modificationsCount - a.modificationsCount);
    }

    const { sliced, pagination } = this.paginate(mapped, query.pagination?.page, query.pagination?.pageSize);
    return { results: sliced, pagination };
  }

  /**
   * Searches code ownership concentration records across repositories.
   */
  async searchOwnership(query: SearchQuery): Promise<{ results: OwnershipSearchResult[]; pagination: PaginationMetadata }> {
    const rawOwnership = await this.searchRepo.getOwnership(query.filter?.repositoryId, 0, 500);
    let mapped = rawOwnership.map((m) => SearchMapper.toOwnershipSearchResult(m));

    if (query.query) {
      mapped = mapped.filter((o) => this.matchesKeyword(query.query, o.filePath, o.primaryAuthor));
    }
    if (query.filter?.repositoryId) {
      mapped = mapped.filter((o) => o.repositoryId === query.filter?.repositoryId);
    }
    if (query.filter?.authorEmail) {
      mapped = mapped.filter((o) => o.primaryAuthor && o.primaryAuthor.toLowerCase().includes(query.filter?.authorEmail?.toLowerCase() || ''));
    }
    if (query.filter?.minScore !== undefined) {
      const min = query.filter.minScore;
      mapped = mapped.filter((o) => o.ownershipPercentage >= min);
    }

    if (query.sort?.field) {
      this.sortItems(mapped, query.sort.field, query.sort.direction);
    } else {
      mapped.sort((a, b) => b.ownershipPercentage - a.ownershipPercentage);
    }

    const { sliced, pagination } = this.paginate(mapped, query.pagination?.page, query.pagination?.pageSize);
    return { results: sliced, pagination };
  }

  /**
   * Searches repository health evaluations by orchestrating insight evaluations across workspaces.
   */
  async searchHealth(query: SearchQuery): Promise<{ results: HealthSearchResult[]; pagination: PaginationMetadata }> {
    const rawRepos = await this.searchRepo.getRepositories(0, 100);
    const reposToEval = query.filter?.repositoryId
      ? rawRepos.filter((r) => r.id === query.filter?.repositoryId)
      : rawRepos;

    const insights = await Promise.all(
      reposToEval.map(async (r) => {
        try {
          return await this.insightService.getRepositoryInsights(r.id);
        } catch {
          return null;
        }
      }),
    );

    let mapped: HealthSearchResult[] = insights
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .map((i) => SearchMapper.toHealthSearchResult(i));

    if (query.query) {
      mapped = mapped.filter((h) => this.matchesKeyword(query.query, h.repositoryName, h.summary, h.riskLevel));
    }
    if (query.filter?.riskLevel) {
      mapped = mapped.filter((h) => h.riskLevel.toUpperCase() === query.filter?.riskLevel?.toUpperCase());
    }
    if (query.filter?.minScore !== undefined) {
      const min = query.filter.minScore;
      mapped = mapped.filter((h) => h.healthScore >= min);
    }
    if (query.filter?.maxScore !== undefined) {
      const max = query.filter.maxScore;
      mapped = mapped.filter((h) => h.healthScore <= max);
    }

    if (query.sort?.field) {
      this.sortItems(mapped, query.sort.field, query.sort.direction);
    } else {
      mapped.sort((a, b) => a.healthScore - b.healthScore);
    }

    const { sliced, pagination } = this.paginate(mapped, query.pagination?.page, query.pagination?.pageSize);
    return { results: sliced, pagination };
  }

  /**
   * Searches actionable engineering recommendations and insight items across workspaces.
   */
  async searchInsights(query: SearchQuery): Promise<{ results: InsightSearchResult[]; pagination: PaginationMetadata }> {
    const rawRepos = await this.searchRepo.getRepositories(0, 100);
    const reposToEval = query.filter?.repositoryId
      ? rawRepos.filter((r) => r.id === query.filter?.repositoryId)
      : rawRepos;

    const insights = await Promise.all(
      reposToEval.map(async (r) => {
        try {
          return await this.insightService.getRepositoryInsights(r.id);
        } catch {
          return null;
        }
      }),
    );

    let mapped: InsightSearchResult[] = insights
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .flatMap((i) => SearchMapper.toInsightSearchResults(i));

    if (query.query) {
      mapped = mapped.filter((i) => this.matchesKeyword(query.query, i.repositoryName, i.title, i.description, i.domain));
    }
    if (query.filter?.riskLevel) {
      mapped = mapped.filter((i) => i.riskLevel.toUpperCase() === query.filter?.riskLevel?.toUpperCase());
    }

    if (query.sort?.field) {
      this.sortItems(mapped, query.sort.field, query.sort.direction);
    }

    const { sliced, pagination } = this.paginate(mapped, query.pagination?.page, query.pagination?.pageSize);
    return { results: sliced, pagination };
  }

  /**
   * Executes a unified search query across all target engineering domains.
   */
  async search(query: SearchQuery): Promise<UnifiedSearchResponse> {
    const targetType = query.filter?.entityType || 'ALL';

    const [repos, devs, health, hotspots, ownership, insights] = await Promise.all([
      targetType === 'ALL' || targetType === 'REPOSITORY' ? this.searchRepositories(query) : Promise.resolve({ results: [], pagination: SearchMapper.buildPaginationMetadata(0, 1, 20) }),
      targetType === 'ALL' || targetType === 'DEVELOPER' ? this.searchDevelopers(query) : Promise.resolve({ results: [], pagination: SearchMapper.buildPaginationMetadata(0, 1, 20) }),
      targetType === 'ALL' || targetType === 'HEALTH' ? this.searchHealth(query) : Promise.resolve({ results: [], pagination: SearchMapper.buildPaginationMetadata(0, 1, 20) }),
      targetType === 'ALL' || targetType === 'HOTSPOT' ? this.searchHotspots(query) : Promise.resolve({ results: [], pagination: SearchMapper.buildPaginationMetadata(0, 1, 20) }),
      targetType === 'ALL' || targetType === 'OWNERSHIP' ? this.searchOwnership(query) : Promise.resolve({ results: [], pagination: SearchMapper.buildPaginationMetadata(0, 1, 20) }),
      targetType === 'ALL' || targetType === 'INSIGHT' ? this.searchInsights(query) : Promise.resolve({ results: [], pagination: SearchMapper.buildPaginationMetadata(0, 1, 20) }),
    ]);

    const totalCombinedItems =
      repos.results.length +
      devs.results.length +
      health.results.length +
      hotspots.results.length +
      ownership.results.length +
      insights.results.length;

    const page = query.pagination?.page ?? 1;
    const pageSize = query.pagination?.pageSize ?? 20;

    return {
      query: query.query ?? '',
      timestamp: new Date().toISOString(),
      repositories: repos.results,
      developers: devs.results,
      health: health.results,
      hotspots: hotspots.results,
      ownership: ownership.results,
      insights: insights.results,
      pagination: SearchMapper.buildPaginationMetadata(totalCombinedItems, page, pageSize),
    };
  }
}
