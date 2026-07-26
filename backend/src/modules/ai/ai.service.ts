/**
 * AI Execution Service (`src/modules/ai/ai.service.ts`)
 *
 * Purpose:
 *   The primary orchestration layer for AI completions in GitPro.
 *   Receives immutable AIContext payloads, verifies deterministic prompt generation,
 *   resolves target providers via ProviderFactory, and executes completions with
 *   timeout limits, retry strategies with exponential backoff, and vendor fallback.
 *
 * Strict Architectural Rules:
 *   - Zero controllers, zero routes, zero repositories, zero Prisma queries.
 *   - Zero git access, zero graph traversals, zero metric recalculations.
 *   - Enforces token metadata tracking and prompt/response version tagging.
 */

import { AIContext, AIRequestOptions, AIResponse } from './ai.types';
import { AIExecutionConfig, DEFAULT_AI_CONFIG } from './ai.config';
import { PromptBuilder } from './prompt.builder';
import { ProviderFactory } from './provider.factory';
import { IAIProvider } from './provider.interface';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class AIService {
  private readonly defaultConfig: AIExecutionConfig;

  constructor(defaultConfig?: AIExecutionConfig) {
    this.defaultConfig = defaultConfig ?? DEFAULT_AI_CONFIG;
  }

  /**
   * Internal execution engine implementing retry strategies with exponential backoff,
   * timeout boundaries, and provider fallback mechanisms.
   *
   * @param action Lambda invoking the target completion method on an resolved IAIProvider.
   * @param config Immutable execution configuration specifying timeouts, retries, and fallbacks.
   * @returns Standardized AIResponse enriched with versioning and usage metadata.
   */
  private async executeWithRetryAndFallback(
    action: (provider: IAIProvider) => Promise<AIResponse>,
    config: AIExecutionConfig,
  ): Promise<AIResponse> {
    const retries = config.retries ?? 2;
    const timeoutMs = config.timeoutMs ?? 15000;
    const promptVer = config.promptVersion ?? 'v1.0.0';
    const responseVer = config.responseVersion ?? 'v1.0.0';

    const executeWithTimeout = async (provider: IAIProvider): Promise<AIResponse> => {
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new AppError(
              `AI completion timed out after ${timeoutMs}ms on provider '${provider.providerType}'.`,
              HTTP_STATUS.INTERNAL_SERVER_ERROR,
              true,
            ),
          );
        }, timeoutMs);
      });

      try {
        const result = await Promise.race([action(provider), timeoutPromise]);
        return result;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    let lastError: Error | undefined;
    const primaryProvider = ProviderFactory.createProvider(config);

    // Attempt primary provider with exponential backoff retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await executeWithTimeout(primaryProvider);
        return {
          ...response,
          promptVersion: promptVer,
          responseVersion: responseVer,
        };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retries) {
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // Attempt provider fallback if configured and primary failed all retry attempts
    if (config.fallbackProvider) {
      try {
        const fallbackProvider = ProviderFactory.createProvider(config.fallbackProvider);
        const fallbackResponse = await executeWithTimeout(fallbackProvider);
        return {
          ...fallbackResponse,
          promptVersion: promptVer,
          responseVersion: responseVer,
        };
      } catch (fallbackError: unknown) {
        const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
        throw new AppError(
          `AI execution failed on primary provider '${config.provider}' after ${retries + 1} attempts, and fallback provider '${config.fallbackProvider.provider}' also failed: ${fallbackErr.message || lastError?.message || 'Unknown network error'}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          true,
        );
      }
    }

    throw new AppError(
      `AI execution failed on primary provider '${config.provider}' after ${retries + 1} attempts: ${lastError?.message || 'Unknown network error'}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      true,
    );
  }

  /**
   * Generates a high-level executive narrative summary from an immutable AIContext container.
   *
   * @param context Immutable AIContext wrapping clean Dashboard or Insight DTOs.
   * @param configOverride Optional execution configuration overrides (provider, model, timeouts).
   * @param options Optional completion execution parameters (temperature, maxTokens).
   * @returns Standardized AIResponse DTO.
   */
  async summarize(
    context: AIContext,
    configOverride?: Partial<AIExecutionConfig>,
    options?: AIRequestOptions,
  ): Promise<AIResponse> {
    const config: AIExecutionConfig = { ...this.defaultConfig, ...configOverride };
    // Validate deterministic prompt generation
    PromptBuilder.buildSummaryPrompt(context);

    return this.executeWithRetryAndFallback(
      (provider) => provider.summarize(context, options),
      config,
    );
  }

  /**
   * Generates an in-depth, contextual engineering explanation targeting a specific topic or metric.
   *
   * @param context Immutable AIContext wrapping clean Dashboard or Insight DTOs.
   * @param target Specific topic or metric to explain (e.g., 'Bus Factor risk in src/billing').
   * @param configOverride Optional execution configuration overrides.
   * @param options Optional completion execution parameters.
   * @returns Standardized AIResponse DTO.
   */
  async explain(
    context: AIContext,
    target: string,
    configOverride?: Partial<AIExecutionConfig>,
    options?: AIRequestOptions,
  ): Promise<AIResponse> {
    const config: AIExecutionConfig = { ...this.defaultConfig, ...configOverride };
    // Validate deterministic prompt generation
    PromptBuilder.buildExplanationPrompt(context, target);

    return this.executeWithRetryAndFallback(
      (provider) => provider.explain(context, target, options),
      config,
    );
  }

  /**
   * Generates a direct response from a raw deterministic prompt string.
   *
   * @param prompt Natural language prompt text.
   * @param configOverride Optional execution configuration overrides.
   * @param options Optional completion execution parameters.
   * @returns Standardized AIResponse DTO.
   */
  async generateResponse(
    prompt: string,
    configOverride?: Partial<AIExecutionConfig>,
    options?: AIRequestOptions,
  ): Promise<AIResponse> {
    const config: AIExecutionConfig = { ...this.defaultConfig, ...configOverride };

    return this.executeWithRetryAndFallback(
      (provider) => provider.generateResponse(prompt, options),
      config,
    );
  }
}
