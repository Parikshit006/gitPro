/**
 * AI Context Builder (`src/modules/ai/context.builder.ts`)
 *
 * Purpose:
 *   Assembles immutable, standardized AIContext containers from clean presentation
 *   DTOs (DashboardOverview, RepositoryInsight, ExecutiveSummary).
 *
 * Strict Architectural Rules:
 *   - Zero database persistence imports, zero Prisma schemas, zero git client calls.
 *   - Ensures the AI layer is completely decoupled from raw database tables and graphs.
 */

import crypto from 'crypto';
import { AIContext } from './ai.types';
import { DashboardOverview } from '../dashboard/dashboard.types';
import { RepositoryInsight, ExecutiveSummary } from '../insights/insight.types';

export class ContextBuilder {
  /**
   * Builds an immutable AIContext from a high-level DashboardOverview DTO.
   *
   * @param overview The frontend-ready DashboardOverview DTO.
   * @param customMetadata Optional key-value metadata to attach to the context.
   * @returns Immutable AIContext container.
   */
  static fromDashboardOverview(
    overview: DashboardOverview,
    customMetadata?: Record<string, unknown>,
  ): AIContext {
    return {
      contextId: crypto.randomUUID(),
      contextType: 'DASHBOARD_OVERVIEW',
      timestamp: new Date().toISOString(),
      dashboardOverview: overview,
      customMetadata,
    };
  }

  /**
   * Builds an immutable AIContext from a single repository's deterministic RepositoryInsight DTO.
   *
   * @param insight The frontend-ready RepositoryInsight DTO.
   * @param customMetadata Optional key-value metadata to attach to the context.
   * @returns Immutable AIContext container.
   */
  static fromRepositoryInsight(
    insight: RepositoryInsight,
    customMetadata?: Record<string, unknown>,
  ): AIContext {
    return {
      contextId: crypto.randomUUID(),
      contextType: 'REPOSITORY_INSIGHT',
      timestamp: new Date().toISOString(),
      repositoryInsight: insight,
      customMetadata,
    };
  }

  /**
   * Builds an immutable AIContext from a multi-repository ExecutiveSummary DTO.
   *
   * @param summary The frontend-ready ExecutiveSummary DTO.
   * @param customMetadata Optional key-value metadata to attach to the context.
   * @returns Immutable AIContext container.
   */
  static fromExecutiveSummary(
    summary: ExecutiveSummary,
    customMetadata?: Record<string, unknown>,
  ): AIContext {
    return {
      contextId: crypto.randomUUID(),
      contextType: 'EXECUTIVE_SUMMARY',
      timestamp: new Date().toISOString(),
      executiveSummary: summary,
      customMetadata,
    };
  }
}
