/**
 * Search Mapper (Pure Transformation Layer)
 *
 * Purpose:
 *   Converts raw persistence records from existing repositories (Repository, MetricResult, Developer)
 *   and domain evaluations (RepositoryInsight) into immutable, frontend-facing search DTOs.
 *
 * Strict Architectural Rules:
 *   - Only DTO conversion: zero business logic, zero database access, zero orchestration.
 *   - Ensures clean JSON serializability and isolates search consumers from ORM schemas.
 */

import { Repository as PrismaRepository, MetricResult, Developer } from '@prisma/client';
import { Repository as DomainRepository } from '../repository/repository.types';
import {
  RepositorySearchResult,
  DeveloperSearchResult,
  HotspotSearchResult,
  OwnershipSearchResult,
  HealthSearchResult,
  InsightSearchResult,
  PaginationMetadata,
} from './search.types';
import { RepositoryInsight } from '../insights/insight.types';

interface MetricMetadata {
  readonly rank?: number;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly churnPercentage?: number;
}

export class SearchMapper {
  /**
   * Safely casts raw Prisma JsonValue to typed MetricMetadata without using 'any'.
   */
  private static parseMeta(metric: MetricResult): MetricMetadata {
    if (!metric || !metric.metadata || typeof metric.metadata !== 'object') {
      return {};
    }
    return metric.metadata as unknown as MetricMetadata;
  }

  /**
   * Converts a raw Prisma or Domain Repository record into a RepositorySearchResult DTO.
   */
  static toRepositorySearchResult(
    repo: PrismaRepository | DomainRepository,
  ): RepositorySearchResult {
    return {
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      fullName: repo.fullName,
      description: repo.description ?? undefined,
      language: repo.language ?? undefined,
      status: repo.status,
      updatedAt: repo.updatedAt instanceof Date ? repo.updatedAt.toISOString() : String(repo.updatedAt),
    };
  }

  /**
   * Converts a raw Developer persistence model into a DeveloperSearchResult DTO.
   */
  static toDeveloperSearchResult(dev: Developer): DeveloperSearchResult {
    return {
      id: dev.id,
      email: dev.email,
      name: dev.name ?? undefined,
      avatarUrl: undefined,
      createdAt: dev.createdAt instanceof Date ? dev.createdAt.toISOString() : String(dev.createdAt),
    };
  }

  /**
   * Converts a hotspot MetricResult record into a HotspotSearchResult DTO.
   */
  static toHotspotSearchResult(metric: MetricResult): HotspotSearchResult {
    const meta = this.parseMeta(metric);
    return {
      id: metric.id,
      repositoryId: metric.repositoryId,
      filePath: metric.entityId,
      modificationsCount: Math.round(metric.score),
      rank: meta.rank ?? undefined,
      calculatedAt: metric.calculatedAt instanceof Date ? metric.calculatedAt.toISOString() : String(metric.calculatedAt),
    };
  }

  /**
   * Converts an ownership MetricResult record into an OwnershipSearchResult DTO.
   */
  static toOwnershipSearchResult(metric: MetricResult): OwnershipSearchResult {
    const meta = this.parseMeta(metric);
    const score = metric.score > 1 ? metric.score : metric.score * 100;
    return {
      id: metric.id,
      repositoryId: metric.repositoryId,
      filePath: metric.entityId,
      ownershipPercentage: Math.round(score * 10) / 10,
      primaryAuthor: meta.authorName ?? meta.authorEmail ?? undefined,
      calculatedAt: metric.calculatedAt instanceof Date ? metric.calculatedAt.toISOString() : String(metric.calculatedAt),
    };
  }

  /**
   * Converts a consolidated RepositoryInsight evaluation into a HealthSearchResult DTO.
   */
  static toHealthSearchResult(insight: RepositoryInsight): HealthSearchResult {
    return {
      repositoryId: insight.repositoryId,
      repositoryName: insight.repositoryName,
      healthScore: insight.overallHealthScore,
      riskLevel: insight.overallRiskLevel,
      summary: insight.executiveSummary,
      evaluatedAt: insight.generatedAt,
    };
  }

  /**
   * Extracts prescriptive recommendation items from a RepositoryInsight into InsightSearchResult DTOs.
   */
  static toInsightSearchResults(insight: RepositoryInsight): ReadonlyArray<InsightSearchResult> {
    return insight.consolidatedRecommendations.map((rec) => ({
      insightId: rec.id,
      repositoryId: insight.repositoryId,
      repositoryName: insight.repositoryName,
      riskLevel: rec.riskLevel,
      title: rec.title,
      description: rec.description,
      domain: rec.title.toLowerCase().includes('bus factor') || rec.title.toLowerCase().includes('cross-train')
        ? 'Bus Factor'
        : rec.title.toLowerCase().includes('silo') || rec.title.toLowerCase().includes('ownership')
          ? 'Code Ownership'
          : rec.title.toLowerCase().includes('refactor') || rec.title.toLowerCase().includes('churn')
            ? 'Hotspots'
            : 'Activity',
      generatedAt: rec.generatedAt,
    }));
  }

  /**
   * Constructs standardized pagination metadata for search result envelopes.
   */
  static buildPaginationMetadata(
    totalItems: number,
    page: number,
    pageSize: number,
  ): PaginationMetadata {
    const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
