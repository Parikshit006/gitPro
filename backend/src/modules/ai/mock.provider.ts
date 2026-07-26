/**
 * Mock AI Provider (`src/modules/ai/mock.provider.ts`)
 *
 * Purpose:
 *   Returns deterministic, mathematically reproducible fake completions.
 *   Essential for unit tests, continuous integration (CI) pipelines, and air-gapped
 *   offline execution modes where commercial LLM network access is unavailable or disabled.
 *
 * Strict Architectural Rules:
 *   - Zero network invocations, zero database access, zero SDK imports.
 */

import { IAIProvider } from './provider.interface';
import { AIContext, AIModelConfig, AIRequestOptions, AIResponse } from './ai.types';

export class MockProvider implements IAIProvider {
  readonly providerType = 'MOCK';
  readonly modelName: string;

  constructor(config: AIModelConfig) {
    this.modelName = config.modelName || 'mock-deterministic-v1';
  }

  /**
   * Generates a deterministic mock response for raw prompt completion requests.
   */
  async generateResponse(prompt: string, _options?: AIRequestOptions): Promise<AIResponse> {
    const wordCount = prompt.split(/\s+/).length;
    const content = `[MOCK_COMPLETION] Successfully processed prompt (${wordCount} words). Engineering analysis indicates all tracked components are operating within expected tolerances.`;

    return {
      success: true,
      content,
      provider: this.providerType,
      modelName: this.modelName,
      promptTokens: wordCount * 2,
      completionTokens: 35,
      totalTokens: wordCount * 2 + 35,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a deterministic mock narrative summary for an immutable AIContext.
   */
  async summarize(context: AIContext, _options?: AIRequestOptions): Promise<AIResponse> {
    let content = `[MOCK_SUMMARY] Executive synthesis generated for context type: ${context.contextType}.`;

    if (context.contextType === 'REPOSITORY_INSIGHT' && context.repositoryInsight) {
      const { repositoryName, overallHealthScore, overallRiskLevel } = context.repositoryInsight;
      content = `[MOCK_SUMMARY] Workspace '${repositoryName}' is evaluated at overall risk level ${overallRiskLevel} with a health index of ${overallHealthScore}/100. Maintainer redundancy and code churn metrics are within monitored tolerances.`;
    } else if (context.contextType === 'EXECUTIVE_SUMMARY' && context.executiveSummary) {
      const { totalRepositoriesCount, overallOrganizationHealthIndex, organizationRiskLevel } =
        context.executiveSummary;
      content = `[MOCK_SUMMARY] Organization health index across ${totalRepositoriesCount} tracked repositories is ${overallOrganizationHealthIndex}/100 (${organizationRiskLevel}). Leadership interventions are recommended for top maintainer bottleneck repositories.`;
    }

    return {
      success: true,
      content,
      provider: this.providerType,
      modelName: this.modelName,
      promptTokens: 150,
      completionTokens: 45,
      totalTokens: 195,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a deterministic mock deep-dive explanation for a target topic within an AIContext.
   */
  async explain(context: AIContext, target: string, _options?: AIRequestOptions): Promise<AIResponse> {
    const content = `[MOCK_EXPLANATION] Diagnostic deep-dive for target: "${target}" in context ${context.contextId}. Analysis confirms threshold breach caused by concentrated authorship. Recommended action: enforce pair programming and require joint peer reviews.`;

    return {
      success: true,
      content,
      provider: this.providerType,
      modelName: this.modelName,
      promptTokens: 180,
      completionTokens: 50,
      totalTokens: 230,
      generatedAt: new Date().toISOString(),
    };
  }
}
