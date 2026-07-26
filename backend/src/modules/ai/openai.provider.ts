/**
 * OpenAI Provider (`src/modules/ai/openai.provider.ts`)
 *
 * Purpose:
 *   Concrete AI provider implementation utilizing the official OpenAI Node.js SDK (`openai`).
 *   Translates standardized AI completions and context briefings into OpenAI chat completions.
 *
 * Strict Architectural Rules:
 *   - Zero database access, zero Prisma imports, zero git graph traversals.
 *   - Strictly implements IAIProvider contracts without domain business logic.
 */

import OpenAI from 'openai';
import { IAIProvider } from './provider.interface';
import { AIContext, AIModelConfig, AIRequestOptions, AIResponse } from './ai.types';
import { PromptBuilder } from './prompt.builder';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class OpenAIProvider implements IAIProvider {
  readonly providerType = 'OPENAI';
  readonly modelName: string;
  private readonly client: OpenAI;

  constructor(config: AIModelConfig) {
    this.modelName = config.modelName || 'gpt-4o';
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'missing-openai-api-key',
      baseURL: config.baseUrl,
    });
  }

  /**
   * Executes a chat completion call against OpenAI APIs using the supplied prompt text.
   */
  async generateResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
          { role: 'user' as const, content: prompt },
        ],
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 1500,
      });

      const choice = completion.choices[0];
      const content = choice?.message?.content ?? '';
      const usage = completion.usage;

      return {
        success: true,
        content,
        provider: this.providerType,
        modelName: this.modelName,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(
        `OpenAI API execution failed (${this.modelName}): ${err.message || 'Unknown network error'}`,
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
