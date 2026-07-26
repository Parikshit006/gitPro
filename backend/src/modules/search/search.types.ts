/**
 * Search Domain Contracts (`src/modules/search/search.types.ts`)
 *
 * Purpose:
 *   Defines immutable, frontend-facing Data Transfer Objects (DTOs) and query interfaces
 *   for GitPro's unified Search module.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero Express / HTTP controller imports.
 *   - All interfaces must be strictly readonly, immutable, and JSON serializable.
 */

/**
 * Target domain entities supported by the unified search engine.
 */
export type SearchEntityType =
  | 'REPOSITORY'
  | 'DEVELOPER'
  | 'HEALTH'
  | 'HOTSPOT'
  | 'OWNERSHIP'
  | 'INSIGHT'
  | 'ALL';

/**
 * Directional sorting options.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Multi-dimensional filtering parameters for search execution.
 */
export interface SearchFilter {
  readonly entityType?: SearchEntityType;
  readonly repositoryId?: string;
  readonly riskLevel?: string;
  readonly language?: string;
  readonly authorEmail?: string;
  readonly minScore?: number;
  readonly maxScore?: number;
}

/**
 * Sorting specification for ordering search results.
 */
export interface SearchSorting {
  readonly field?: string;
  readonly direction?: SortDirection;
}

/**
 * Pagination request parameters.
 */
export interface SearchPagination {
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * Composite search query request DTO received by SearchService.
 */
export interface SearchQuery {
  readonly query?: string;
  readonly filter?: SearchFilter;
  readonly sort?: SearchSorting;
  readonly pagination?: SearchPagination;
}

/**
 * Standardized pagination response metadata envelope.
 */
export interface PaginationMetadata {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * Frontend-facing DTO representing a matched repository in search results.
 */
export interface RepositorySearchResult {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly fullName: string;
  readonly description?: string;
  readonly language?: string;
  readonly status: string;
  readonly updatedAt: string;
}

/**
 * Frontend-facing DTO representing a matched developer in search results.
 */
export interface DeveloperSearchResult {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly avatarUrl?: string;
  readonly createdAt: string;
}

/**
 * Frontend-facing DTO representing a matched code hotspot in search results.
 */
export interface HotspotSearchResult {
  readonly id: string;
  readonly repositoryId: string;
  readonly filePath: string;
  readonly modificationsCount: number;
  readonly rank?: number;
  readonly calculatedAt: string;
}

/**
 * Frontend-facing DTO representing a matched code ownership record in search results.
 */
export interface OwnershipSearchResult {
  readonly id: string;
  readonly repositoryId: string;
  readonly filePath: string;
  readonly ownershipPercentage: number;
  readonly primaryAuthor?: string;
  readonly calculatedAt: string;
}

/**
 * Frontend-facing DTO representing a matched repository health evaluation in search results.
 */
export interface HealthSearchResult {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly healthScore: number;
  readonly riskLevel: string;
  readonly summary: string;
  readonly evaluatedAt: string;
}

/**
 * Frontend-facing DTO representing a matched engineering insight or recommendation in search results.
 */
export interface InsightSearchResult {
  readonly insightId: string;
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly riskLevel: string;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
  readonly generatedAt: string;
}

/**
 * Consolidated, unified search response envelope containing matched results across all domains.
 */
export interface UnifiedSearchResponse {
  readonly query: string;
  readonly timestamp: string;
  readonly repositories: ReadonlyArray<RepositorySearchResult>;
  readonly developers: ReadonlyArray<DeveloperSearchResult>;
  readonly health: ReadonlyArray<HealthSearchResult>;
  readonly hotspots: ReadonlyArray<HotspotSearchResult>;
  readonly ownership: ReadonlyArray<OwnershipSearchResult>;
  readonly insights: ReadonlyArray<InsightSearchResult>;
  readonly pagination: PaginationMetadata;
}
