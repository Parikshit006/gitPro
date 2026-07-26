/**
 * AI Provider Factory (`src/modules/ai/provider.factory.ts`)
 *
 * Purpose:
 *   Instantiates and returns concrete AI provider implementations based on immutable configuration.
 *   Provides default registrations for OpenAI, Anthropic, and Mock providers while maintaining
 *   a dynamic registration registry for custom extensions.
 *
 * Strict Architectural Rules:
 *   - Zero database queries, zero Prisma models, zero business logic.
 *   - Must return OpenAI, Anthropic, or Mock provider implementations based on configuration.
 */

import { IAIProvider } from './provider.interface';
import { AIModelConfig, AIProviderType } from './ai.types';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { MockProvider } from './mock.provider';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export type ProviderCreator = (config: AIModelConfig) => IAIProvider;

export class ProviderFactory {
  private static readonly registry = new Map<AIProviderType, ProviderCreator>([
    ['OPENAI', (config: AIModelConfig) => new OpenAIProvider(config)],
    ['ANTHROPIC', (config: AIModelConfig) => new AnthropicProvider(config)],
    ['MOCK', (config: AIModelConfig) => new MockProvider(config)],
  ]);

  /**
   * Registers a concrete provider factory creator function for a specific vendor type.
   * Enables pluggable vendor implementations without modifying core foundation logic.
   *
   * @param providerType Target AI provider enum type.
   * @param creator Factory function responsible for instantiating the concrete provider.
   */
  static registerProvider(providerType: AIProviderType, creator: ProviderCreator): void {
    this.registry.set(providerType, creator);
  }

  /**
   * Instantiates an IAIProvider implementation matching the supplied configuration.
   * Resolves OpenAI, Anthropic, or Mock providers automatically.
   *
   * @param config Immutable model configuration specifying target vendor and parameters.
   * @returns An initialized instance implementing IAIProvider.
   * @throws AppError if the requested provider is not registered or supported.
   */
  static createProvider(config: AIModelConfig): IAIProvider {
    const creator = this.registry.get(config.provider);
    if (!creator) {
      throw new AppError(
        `AI provider '${config.provider}' is not registered or supported. Available providers: ${Array.from(this.registry.keys()).join(', ')}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
    return creator(config);
  }

  /**
   * Returns an immutable list of currently registered vendor provider types.
   *
   * @returns Readonly array of supported AIProviderType keys.
   */
  static getRegisteredProviders(): ReadonlyArray<AIProviderType> {
    return Array.from(this.registry.keys());
  }

  /**
   * Clears all custom registered providers and re-initializes default vendor mappings.
   */
  static resetRegistry(): void {
    this.registry.clear();
    this.registry.set('OPENAI', (config: AIModelConfig) => new OpenAIProvider(config));
    this.registry.set('ANTHROPIC', (config: AIModelConfig) => new AnthropicProvider(config));
    this.registry.set('MOCK', (config: AIModelConfig) => new MockProvider(config));
  }
}
