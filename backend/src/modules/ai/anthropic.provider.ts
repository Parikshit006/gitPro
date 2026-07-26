/**
 * Anthropic Provider (`src/modules/ai/anthropic.provider.ts`)
 *
 * Purpose:
 *   Concrete AI provider implementation utilizing the official Anthropic Node.js SDK (`@anthropic-ai/sdk`).
 *   Translates standardized AI completions and context briefings into Anthropic Claude message completions.
 *
 * Strict Architectural Rules:
 *   - Zero database access, zero Prisma imports, zero git graph traversals.
 *   - Strictly implements IAIProvider contracts without domain business logic.
 */

import Anthropic from '@anthropic-ai/sdk';
import { IAIProvider } from './provider.interface';
import { AIContext, AIModelConfig, AIRequestOptions, AIResponse } from './ai.types';
import { PromptBuilder } from './prompt.builder';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class AnthropicProvider implements IAIProvider {
  readonly providerType = 'ANTHROPIC';
  readonly modelName: string;
  private readonly client: Anthropic;

  constructor(config: AIModelConfig) {
    this.modelName = config.modelName || 'claude-3-5-sonnet-20240620';
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || 'missing-anthropic-api-key',
      baseURL: config.baseUrl,
    });
  }

  /**
   * Executes a messages completion call against Anthropic APIs using the supplied prompt text.
   */
  async generateResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: options?.maxTokens ?? 1500,
        temperature: options?.temperature ?? 0.2,
        ...(options?.systemPrompt ? { system: options.systemPrompt } : {}),
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = response.content[0];
      const content = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
      const usage = response.usage;

      return {
        success: true,
        content,
        provider: this.providerType,
        modelName: this.modelName,
        promptTokens: usage?.input_tokens,
        completionTokens: usage?.output_tokens,
        totalTokens: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
        generatedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `Anthropic API execution failed (${this.modelName}): ${err.message || 'Unknown network error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Generates an executive narrative summary from an immutable AIContext container.
   */
  async summarize(context: AIContext, options?: AIRequestOptions): Promise<AIResponse> {
    const prompt = PromptBuilder.buildSummaryPrompt(context);
    return this.generateResponse(prompt, options);
  }

  /**
   * Generates a deep-dive explanation for a target topic from an immutable AIContext container.
   */
  async explain(context: AIContext, target: string, options?: AIRequestOptions): Promise<AIResponse> {
    const prompt = PromptBuilder.buildExplanationPrompt(context, target);
    return this.generateResponse(prompt, options);
  }
}
