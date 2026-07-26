/**
 * AI Execution Configuration (`src/modules/ai/ai.config.ts`)
 *
 * Purpose:
 *   Defines execution parameters, timeout limits, retry strategies, and fallback providers
 *   for the AI Execution Layer.
 *
 * Strict Architectural Rules:
 *   - Zero database queries, zero Prisma models, zero business logic.
 */

import { AIModelConfig, AIProviderType } from './ai.types';

export interface AIExecutionConfig extends AIModelConfig {
  readonly retries?: number;
  readonly timeoutMs?: number;
  readonly fallbackProvider?: AIModelConfig;
  readonly promptVersion?: string;
  readonly responseVersion?: string;
}

export const MOCK_MODEL_CONFIG: AIModelConfig = {
  provider: 'MOCK',
  modelName: 'mock-deterministic-v1',
  temperature: 0.0,
  maxTokens: 1000,
};

export const DEFAULT_AI_CONFIG: AIExecutionConfig = {
  provider: (process.env.AI_PROVIDER as AIProviderType) || 'MOCK',
  modelName: process.env.AI_MODEL_NAME || 'mock-deterministic-v1',
  temperature: Number(process.env.AI_TEMPERATURE) || 0.2,
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 1500,
  apiKey: process.env.AI_API_KEY || 'mock-api-key',
  retries: 2,
  timeoutMs: 15000,
  fallbackProvider: MOCK_MODEL_CONFIG,
  promptVersion: 'v1.0.0',
  responseVersion: 'v1.0.0',
};
