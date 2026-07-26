/**
 * AI Foundation Domain Contracts (`src/modules/ai/ai.types.ts`)
 *
 * Purpose:
 *   Defines pure, frontend-facing and provider-agnostic Data Transfer Objects (DTOs)
 *   and configuration types for GitPro's AI Foundation layer.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero Express / HTTP controller imports.
 *   - Zero OpenAI / Anthropic SDK imports or runtime dependencies.
 *   - Must consume ONLY Dashboard DTOs and Insight DTOs.
 *   - All interfaces must be strictly readonly, immutable, and JSON serializable.
 */

import { DashboardOverview } from '../dashboard/dashboard.types';
import { RepositoryInsight, ExecutiveSummary } from '../insights/insight.types';

/**
 * Supported LLM vendor provider types.
 */
export type AIProviderType = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'LOCAL' | 'MOCK';

/**
 * Categorization of the input context provided to an AI provider.
 */
export type AIContextType =
  | 'DASHBOARD_OVERVIEW'
  | 'REPOSITORY_INSIGHT'
  | 'EXECUTIVE_SUMMARY'
  | 'CUSTOM';

/**
 * Immutable configuration settings for instantiating an AI provider.
 */
export interface AIModelConfig {
  readonly provider: AIProviderType;
  readonly modelName: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly apiKey?: string;
  readonly baseUrl?: string;
}

/**
 * Optional runtime execution parameters for AI completion requests.
 */
export interface AIRequestOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
}

/**
 * Standardized, vendor-agnostic response envelope returned by any AI provider.
 */
export interface AIResponse {
  readonly success: boolean;
  readonly content: string;
  readonly provider: AIProviderType;
  readonly modelName: string;
  readonly promptTokens?: number;
  readonly completionTokens?: number;
  readonly totalTokens?: number;
  readonly promptVersion?: string;
  readonly responseVersion?: string;
  readonly generatedAt: string;
}

/**
 * Immutable context container isolating the AI layer from database schemas.
 * Wraps clean presentation DTOs from the Dashboard and Insight modules.
 */
export interface AIContext {
  readonly contextId: string;
  readonly contextType: AIContextType;
  readonly timestamp: string;
  readonly dashboardOverview?: DashboardOverview;
  readonly repositoryInsight?: RepositoryInsight;
  readonly executiveSummary?: ExecutiveSummary;
  readonly customMetadata?: Record<string, unknown>;
}
