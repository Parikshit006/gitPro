/**
 * AI Provider Interface (`src/modules/ai/provider.interface.ts`)
 *
 * Purpose:
 *   Defines the strict contract that any LLM or generative AI integration
 *   (OpenAI, Anthropic, Gemini, Local LLaMA, or Mock stubs) must implement.
 *
 * Strict Architectural Rules:
 *   - Zero vendor SDK imports or concrete implementations.
 *   - All providers must accept clean AIContext containers without accessing
 *     database persistence layers, Prisma schemas, or Git repositories.
 */

import { AIContext, AIRequestOptions, AIResponse, AIProviderType } from './ai.types';

export interface IAIProvider {
  /**
   * Identifies the underlying vendor or provider engine.
   */
  readonly providerType: AIProviderType;

  /**
   * Identifies the specific model identifier (e.g., 'gpt-4o', 'claude-3-5-sonnet').
   */
  readonly modelName: string;

  /**
   * Generates a direct completion response from a formatted natural language prompt string.
   *
   * @param prompt Deterministic natural language prompt text.
   * @param options Optional completion execution parameters (temperature, maxTokens, systemPrompt).
   * @returns Standardized AIResponse DTO.
   */
  generateResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;

  /**
   * Generates a high-level executive or narrative summary from an immutable AIContext container.
   *
   * @param context Immutable AIContext containing clean Dashboard or Insight DTOs.
   * @param options Optional completion execution parameters.
   * @returns Standardized AIResponse DTO.
   */
  summarize(context: AIContext, options?: AIRequestOptions): Promise<AIResponse>;

  /**
   * Generates an in-depth, contextual engineering explanation targeting a specific metric,
   * anomaly, or architectural bottleneck within the provided AIContext.
   *
   * @param context Immutable AIContext containing clean Dashboard or Insight DTOs.
   * @param target Specific target topic or metric to explain (e.g., 'Bus Factor in billing engine').
   * @param options Optional completion execution parameters.
   * @returns Standardized AIResponse DTO.
   */
  explain(context: AIContext, target: string, options?: AIRequestOptions): Promise<AIResponse>;
}
