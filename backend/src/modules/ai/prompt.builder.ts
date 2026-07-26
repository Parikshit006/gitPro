/**
 * AI Prompt Builder (`src/modules/ai/prompt.builder.ts`)
 *
 * Purpose:
 *   Generates deterministic, structured natural language prompts from immutable AIContext containers.
 *   Ensures any downstream LLM provider receives consistent, mathematically reproducible context
 *   without hallucinating database schemas or architectural dependencies.
 *
 * Strict Architectural Rules:
 *   - Must be 100% deterministic: identical AIContext containers must produce identical prompt strings.
 *   - Zero database queries, zero Prisma models, zero network invocations.
 */

import { AIContext } from './ai.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class PromptBuilder {
  /**
   * Generates a deterministic summarization prompt from an immutable AIContext container.
   *
   * @param context Immutable AIContext wrapping clean presentation DTOs.
   * @returns Formatted natural language prompt string.
   */
  static buildSummaryPrompt(context: AIContext): string {
    const header = `You are the AI Executive Assistant for GitPro, an Engineering Intelligence Platform. Provide a high-level professional summary of the following engineering data generated at ${context.timestamp}.\n\n`;

    if (context.contextType === 'DASHBOARD_OVERVIEW' && context.dashboardOverview) {
      const { totalRepositoriesCount, totalDevelopersCount, repositories } = context.dashboardOverview;
      const repoSummary = repositories
        .map(
          (r) =>
            `- Repository '${r.name}': Health Index ${r.healthScore}/100 (${r.healthStatus}), Bus Factor Score ${r.busFactorScore}, Active Contributors: ${r.activeContributorsCount}`,
        )
        .join('\n');

      return `${header}### Dashboard Overview\n- Total Tracked Repositories: ${totalRepositoriesCount}\n- Total Registered Developers: ${totalDevelopersCount}\n\n### Repository Metrics Summary\n${repoSummary}\n\n### Instructions\nProvide an executive briefing summarizing overall organizational health, identifying any maintainer risks or bottlenecks across these workspaces.`;
    }

    if (context.contextType === 'REPOSITORY_INSIGHT' && context.repositoryInsight) {
      const {
        repositoryName,
        overallHealthScore,
        overallRiskLevel,
        executiveSummary,
        busFactorInsight,
        ownershipInsight,
        hotspotInsight,
        activityInsight,
      } = context.repositoryInsight;

      return `${header}### Repository Intelligence Report: ${repositoryName}\n- Overall Health Score: ${overallHealthScore}/100\n- Overall Risk Level: ${overallRiskLevel}\n- Executive Briefing: ${executiveSummary}\n\n### Specialized Domain Findings\n- Bus Factor: Score ${busFactorInsight.busFactorScore} (${busFactorInsight.riskLevel}) - ${busFactorInsight.summary}\n- Code Ownership: ${ownershipInsight.totalMonopolizedFiles} monopolized files (${ownershipInsight.riskLevel}) - ${ownershipInsight.summary}\n- File Hotspots: ${hotspotInsight.totalHighChurnFiles} high-churn files (${hotspotInsight.riskLevel}) - ${hotspotInsight.summary}\n- Commit Activity: Development Pace is ${activityInsight.developmentPace} - ${activityInsight.summary}\n\n### Instructions\nSynthesize these deterministic findings into an actionable engineering review for the Engineering Manager.`;
    }

    if (context.contextType === 'EXECUTIVE_SUMMARY' && context.executiveSummary) {
      const {
        totalRepositoriesCount,
        totalDevelopersCount,
        overallOrganizationHealthIndex,
        organizationRiskLevel,
        executiveHeadline,
        topOrganizationalRisks,
      } = context.executiveSummary;

      const risksSummary = topOrganizationalRisks
        .map((r) => `- ${r.repositoryName} (${r.riskLevel}): ${r.primaryRiskFactor}`)
        .join('\n');

      return `${header}### Organizational Executive Briefing\n- Total Repositories: ${totalRepositoriesCount}\n- Total Developers: ${totalDevelopersCount}\n- Organization Health Index: ${overallOrganizationHealthIndex}/100 (${organizationRiskLevel})\n- Headline: ${executiveHeadline}\n\n### Top Organizational Risks\n${risksSummary || '- No severe organizational risks detected.'}\n\n### Instructions\nProvide a strategic leadership narrative outlining top priorities for the VP of Engineering to mitigate these maintainer and code churn risks.`;
    }

    if (context.contextType === 'CUSTOM') {
      return `${header}### Custom Engineering Context\n${JSON.stringify(context.customMetadata ?? {}, null, 2)}\n\n### Instructions\nSummarize the key engineering implications of the provided context.`;
    }

    throw new AppError(
      `Invalid or empty AIContext provided for summarization prompt (type: ${context.contextType}).`,
      HTTP_STATUS.BAD_REQUEST,
      true,
    );
  }

  /**
   * Generates a deterministic explanation prompt targeting a specific engineering metric or anomaly.
   *
   * @param context Immutable AIContext wrapping clean presentation DTOs.
   * @param target Specific topic or metric to explain (e.g., 'Bus Factor risk in src/billing').
   * @returns Formatted natural language prompt string.
   */
  static buildExplanationPrompt(context: AIContext, target: string): string {
    const baseSummary = this.buildSummaryPrompt(context);
    return `${baseSummary}\n\n### Deep-Dive Explanation Request\nFocus specifically on explaining the root cause, operational hazards, and prescriptive remediation steps for: "${target}". Do not invent facts or hallucinate authors not listed in the context.`;
  }
}
