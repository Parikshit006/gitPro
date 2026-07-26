/**
 * Insight Service (Deterministic Engineering Recommendation Engine)
 *
 * Purpose:
 *   Converts precomputed engineering metrics into deterministic engineering recommendations
 *   and human-understandable explanations. Coordinates data retrieval strictly via InsightRepository.
 *
 * Strict Architectural Rules:
 *   - Zero controllers, zero routes, zero repositories, zero Prisma queries, zero mappers.
 *   - Zero OpenAI, Anthropic, or external AI/LLM network invocations.
 *   - Never recalculates metrics, never reads Git directly, never traverses graphs.
 *   - Every recommendation is mathematically reproducible and derived from explicit threshold rules.
 */

import crypto from 'crypto';
import { InsightRepository } from './insight.repository';
import {
  RepositoryInsight,
  ExecutiveSummary,
  BusFactorInsight,
  OwnershipInsight,
  HotspotInsight,
  ActivityInsight,
  Recommendation,
  RiskLevel,
} from './insight.types';
import { MetricResult, CommitEvent, Repository } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

/**
 * Internal interface representing typed structure of Prisma JSON metadata on MetricResult.
 */
interface ContributorMeta {
  readonly name?: string;
  readonly email?: string;
  readonly percentage?: number;
}

interface MetricMeta {
  readonly topContributors?: ReadonlyArray<ContributorMeta>;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly rank?: number;
  readonly churnPercentage?: number;
}

export class InsightService {
  private readonly repository: InsightRepository;

  constructor(repository?: InsightRepository) {
    this.repository = repository ?? new InsightRepository();
  }

  /**
   * Safely casts raw Prisma JsonValue to internal MetricMeta type without using 'any'.
   */
  private parseMeta(rec?: MetricResult): MetricMeta {
    if (!rec || !rec.metadata || typeof rec.metadata !== 'object') {
      return {};
    }
    return rec.metadata as unknown as MetricMeta;
  }

  /**
   * Evaluates deterministic rules on Bus Factor metric records.
   * Rule Table:
   *   score <= 1 -> CRITICAL ("Cross-train at least one additional engineer.")
   *   score == 2 -> HIGH ("Require mandatory reviews from second contributor.")
   *   score == 3 -> MEDIUM ("Expand maintainer distribution across teams.")
   *   score > 3  -> HEALTHY
   */
  private evaluateBusFactor(
    repositoryId: string,
    repositoryName: string,
    busFactorMetrics: ReadonlyArray<MetricResult>,
    timestamp: string,
  ): BusFactorInsight {
    const rec = busFactorMetrics.find(
      (m) => m.metricName === 'bus-factor' && m.entityType === 'REPOSITORY',
    );
    const score = rec ? Math.round(rec.score) : 0;
    const meta = this.parseMeta(rec);

    let riskLevel: RiskLevel = 'HEALTHY';
    let summary = `Healthy maintainer distribution in '${repositoryName}'. Knowledge is shared across multiple engineers.`;
    const recommendations: Recommendation[] = [];
    const keyFindings: string[] = [];

    if (score <= 1) {
      riskLevel = 'CRITICAL';
      summary = `Critical maintainer bottleneck in '${repositoryName}': a single developer holds primary knowledge of the codebase.`;
      keyFindings.push(`Bus factor score is ${score}, indicating high dependency on a single maintainer.`);
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Cross-train at least one additional engineer.',
        description:
          'A bus factor of 1 poses severe operational risk. Primary maintainer holds exclusive knowledge of critical repository architecture.',
        riskLevel: 'CRITICAL',
        actionItems: [
          'Identify primary maintainer for critical subsystems.',
          'Schedule pair programming sessions with a secondary engineer.',
          'Require at least one peer reviewer on all pull requests.',
        ],
        targetEntity: {
          type: 'REPOSITORY',
          id: repositoryId,
          name: repositoryName,
        },
        generatedAt: timestamp,
      });
    } else if (score === 2) {
      riskLevel = 'HIGH';
      summary = `High maintainer risk in '${repositoryName}': codebase knowledge is concentrated between only two engineers.`;
      keyFindings.push(`Bus factor score is ${score}. Loss of either engineer introduces severe workflow bottlenecks.`);
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Require mandatory reviews from second contributor.',
        description:
          'Codebase knowledge is concentrated between only two engineers. Enforce joint code ownership.',
        riskLevel: 'HIGH',
        actionItems: [
          'Enforce mandatory code review rules across core modules.',
          'Create architectural documentation for complex domain logic.',
        ],
        targetEntity: {
          type: 'REPOSITORY',
          id: repositoryId,
          name: repositoryName,
        },
        generatedAt: timestamp,
      });
    } else if (score === 3) {
      riskLevel = 'MEDIUM';
      summary = `Moderate maintainer distribution in '${repositoryName}'. Continue cross-training to expand the maintainer pool.`;
      keyFindings.push(`Bus factor score is ${score}, providing moderate resilience against turnover.`);
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Expand maintainer distribution across teams.',
        description: 'Encourage rotating component assignments to widen maintainer pool.',
        riskLevel: 'MEDIUM',
        actionItems: ['Encourage collaborative code reviews on high-ownership files.'],
        targetEntity: {
          type: 'REPOSITORY',
          id: repositoryId,
          name: repositoryName,
        },
        generatedAt: timestamp,
      });
    } else {
      keyFindings.push(`Bus factor score is ${score}, indicating robust maintainer redundancy.`);
    }

    const topContributors = meta.topContributors ?? [];
    const siloedDevelopers = topContributors.slice(0, 2).map((c, idx) => ({
      developerId: `dev-${idx + 1}`,
      name: c.name ?? 'Unknown Developer',
      email: c.email ?? 'unknown',
      riskContribution: `${c.percentage ?? 0}% authorship contribution to repository commits`,
    }));

    return {
      repositoryId,
      busFactorScore: score,
      riskLevel,
      summary,
      keyFindings,
      siloedDevelopers,
      recommendations,
      generatedAt: timestamp,
    };
  }

  /**
   * Evaluates deterministic rules on Code Ownership metric records.
   * Rule Table:
   *   owner > 80% -> HIGH ("Reduce knowledge silo.")
   */
  private evaluateOwnership(
    repositoryId: string,
    repositoryName: string,
    ownershipMetrics: ReadonlyArray<MetricResult>,
    timestamp: string,
  ): OwnershipInsight {
    const fileRecs = ownershipMetrics.filter(
      (m) => m.metricName === 'ownership' && m.entityType === 'FILE',
    );

    const criticalSilos: Array<{
      readonly filePath: string;
      readonly primaryOwner: string;
      readonly ownershipPercentage: number;
      readonly riskExplanation: string;
    }> = [];

    let totalMonopolizedFiles = 0;

    for (const rec of fileRecs) {
      const pct = rec.score > 1 ? rec.score : rec.score * 100;
      if (pct > 80) {
        totalMonopolizedFiles += 1;
        const meta = this.parseMeta(rec);
        if (criticalSilos.length < 5) {
          criticalSilos.push({
            filePath: rec.entityId,
            primaryOwner: meta.authorName ?? meta.authorEmail ?? 'Unknown Developer',
            ownershipPercentage: Math.round(pct * 10) / 10,
            riskExplanation: 'Single author authored >80% of file modifications without significant co-authorship.',
          });
        }
      }
    }

    let riskLevel: RiskLevel = 'HEALTHY';
    let summary = `Healthy code ownership distribution across '${repositoryName}' files.`;
    const recommendations: Recommendation[] = [];
    const keyFindings: string[] = [];

    if (totalMonopolizedFiles > 0) {
      riskLevel = totalMonopolizedFiles >= 5 ? 'HIGH' : 'MEDIUM';
      summary = `High code ownership concentration: ${totalMonopolizedFiles} files in '${repositoryName}' are monopolized (>80% authorship) by a single developer.`;
      keyFindings.push(`${totalMonopolizedFiles} files exhibit severe knowledge monopoly (>80% single-author ownership).`);
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Reduce knowledge silo.',
        description:
          'Multiple core files have over 80% ownership by a single developer. Rotate module assignments.',
        riskLevel: riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
        actionItems: [
          'Assign bug fixes in monopolized modules to non-primary authors.',
          'Require code walk-throughs for top monopolized files.',
        ],
        targetEntity: {
          type: 'REPOSITORY',
          id: repositoryId,
          name: repositoryName,
        },
        generatedAt: timestamp,
      });
    } else {
      keyFindings.push('No files exceed the 80% single-author monopoly threshold.');
    }

    return {
      repositoryId,
      totalMonopolizedFiles,
      riskLevel,
      summary,
      keyFindings,
      criticalSilos,
      recommendations,
      generatedAt: timestamp,
    };
  }

  /**
   * Evaluates deterministic rules on Hotspot metric records.
   * Rule Table:
   *   churn > 50 -> MEDIUM ("Refactor module.")
   */
  private evaluateHotspots(
    repositoryId: string,
    repositoryName: string,
    hotspotMetrics: ReadonlyArray<MetricResult>,
    timestamp: string,
  ): HotspotInsight {
    const fileRecs = hotspotMetrics.filter(
      (m) => (m.metricName === 'hotspots' || m.metricName === 'hotspot') && m.entityType === 'FILE',
    );

    const highChurnRecs = fileRecs.filter((r) => r.score > 50);
    const totalHighChurnFiles = highChurnRecs.length;

    const topCriticalHotspots = fileRecs.slice(0, 5).map((rec, idx) => {
      const meta = this.parseMeta(rec);
      const churn = Math.round(rec.score);
      return {
        filePath: rec.entityId,
        churnRank: meta.rank ?? idx + 1,
        modificationsCount: churn,
        churnPercentage: meta.churnPercentage ?? 0,
        riskExplanation: `High modification frequency (${churn} changes) indicates high instability and defect probability.`,
      };
    });

    let riskLevel: RiskLevel = 'HEALTHY';
    let summary = `No severe high-churn hotspots detected in '${repositoryName}'. Codebase modification cadence is stable.`;
    const recommendations: Recommendation[] = [];
    const keyFindings: string[] = [];

    if (totalHighChurnFiles > 0) {
      riskLevel = totalHighChurnFiles >= 5 ? 'HIGH' : 'MEDIUM';
      summary = `${totalHighChurnFiles} high-churn hotspot files (>50 modifications) detected in '${repositoryName}', indicating potential code instability.`;
      keyFindings.push(`${totalHighChurnFiles} files exceed the 50-modification threshold for high code churn.`);
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Refactor module.',
        description:
          'Files undergoing frequent churn (>50 modifications) indicate code instability or high complexity.',
        riskLevel: 'MEDIUM',
        actionItems: [
          'Conduct code complexity analysis on top hotspot files.',
          'Increase unit test coverage for frequently modified modules.',
          'Break down monolithic files into smaller, focused components.',
        ],
        targetEntity: {
          type: 'REPOSITORY',
          id: repositoryId,
          name: repositoryName,
        },
        generatedAt: timestamp,
      });
    } else {
      keyFindings.push('All tracked files remain below the 50-modification high-churn threshold.');
    }

    return {
      repositoryId,
      totalHighChurnFiles,
      riskLevel,
      summary,
      keyFindings,
      topCriticalHotspots,
      recommendations,
      generatedAt: timestamp,
    };
  }

  /**
   * Evaluates deterministic rules on commit history.
   * Rule Table:
   *   No commits in 30 days -> LOW ACTIVITY ("Review repository health.")
   */
  private evaluateActivity(
    repositoryId: string,
    repositoryName: string,
    recentCommits: ReadonlyArray<CommitEvent>,
    timestamp: string,
  ): ActivityInsight {
    const totalCommitsAnalyzed = recentCommits.length;
    const activeContributorsCount = new Set(recentCommits.map((c) => c.authorEmail)).size;

    const latestCommitDate = recentCommits.length > 0 ? new Date(recentCommits[0].committedAt).getTime() : 0;
    const daysSinceLastCommit = latestCommitDate > 0 ? (Date.now() - latestCommitDate) / (1000 * 60 * 60 * 24) : 999;

    let developmentPace: 'ACCELERATING' | 'STABLE' | 'DECELERATING' | 'STAGNANT' = 'STABLE';
    let summary = `Stable development pace in '${repositoryName}' with steady commit throughput across ${activeContributorsCount} contributors.`;
    const recommendations: Recommendation[] = [];
    const keyFindings: string[] = [];

    if (totalCommitsAnalyzed === 0 || daysSinceLastCommit > 30) {
      developmentPace = 'STAGNANT';
      summary = `Low activity: No commits recorded in '${repositoryName}' in the last 30 days. Repository may be dormant or unmaintained.`;
      keyFindings.push(`No commit activity detected in over ${Math.round(daysSinceLastCommit)} days.`);
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Review repository health.',
        description:
          'No commit activity recorded in the last 30 days. Verify if this codebase is dormant or archived.',
        riskLevel: 'LOW',
        actionItems: [
          'Confirm with engineering leads if this repository is still actively supported.',
          'Check for stale pull requests or unaddressed security alerts.',
        ],
        targetEntity: {
          type: 'REPOSITORY',
          id: repositoryId,
          name: repositoryName,
        },
        generatedAt: timestamp,
      });
    } else if (daysSinceLastCommit <= 7 && totalCommitsAnalyzed >= 20) {
      developmentPace = 'ACCELERATING';
      summary = `High development velocity in '${repositoryName}' with active contributions from ${activeContributorsCount} engineers.`;
      keyFindings.push(`High commit throughput (${totalCommitsAnalyzed} recent commits analyzed).`);
    } else {
      keyFindings.push(`Regular commit activity detected (${totalCommitsAnalyzed} commits across ${activeContributorsCount} developers).`);
    }

    return {
      repositoryId,
      totalCommitsAnalyzed,
      activeContributorsCount,
      developmentPace,
      summary,
      keyFindings,
      recommendations,
      generatedAt: timestamp,
    };
  }

  /**
   * Generates a comprehensive, deterministic RepositoryInsight evaluation for a single repository.
   *
   * @param repositoryId UUID of the target repository.
   * @returns Complete, immutable RepositoryInsight report.
   */
  async getRepositoryInsights(repositoryId: string): Promise<RepositoryInsight> {
    const summary = await this.repository.findRepositorySummary(repositoryId);
    if (!summary.repository) {
      throw new AppError(
        `Repository '${repositoryId}' not found during insight evaluation.`,
        HTTP_STATUS.NOT_FOUND,
        true,
      );
    }

    const timestamp = new Date().toISOString();
    const repoName = summary.repository.name;

    const busFactorInsight = this.evaluateBusFactor(
      repositoryId,
      repoName,
      summary.busFactorMetrics,
      timestamp,
    );
    const ownershipInsight = this.evaluateOwnership(
      repositoryId,
      repoName,
      summary.ownershipMetrics,
      timestamp,
    );
    const hotspotInsight = this.evaluateHotspots(
      repositoryId,
      repoName,
      summary.hotspotMetrics,
      timestamp,
    );
    const activityInsight = this.evaluateActivity(
      repositoryId,
      repoName,
      summary.recentCommits,
      timestamp,
    );

    // Calculate overall health score based on deterministic deductions
    let healthScore = 100;
    if (busFactorInsight.riskLevel === 'CRITICAL') healthScore -= 35;
    else if (busFactorInsight.riskLevel === 'HIGH') healthScore -= 20;
    else if (busFactorInsight.riskLevel === 'MEDIUM') healthScore -= 10;

    if (ownershipInsight.riskLevel === 'HIGH') healthScore -= 25;
    else if (ownershipInsight.riskLevel === 'MEDIUM') healthScore -= 10;

    if (hotspotInsight.riskLevel === 'HIGH') healthScore -= 20;
    else if (hotspotInsight.riskLevel === 'MEDIUM') healthScore -= 10;

    if (activityInsight.developmentPace === 'STAGNANT') healthScore -= 15;

    const overallHealthScore = Math.max(0, Math.min(100, healthScore));

    let overallRiskLevel: RiskLevel = 'HEALTHY';
    if (overallHealthScore < 50 || busFactorInsight.riskLevel === 'CRITICAL') {
      overallRiskLevel = 'CRITICAL';
    } else if (overallHealthScore < 70 || ownershipInsight.riskLevel === 'HIGH') {
      overallRiskLevel = 'HIGH';
    } else if (overallHealthScore < 85) {
      overallRiskLevel = 'MEDIUM';
    }

    const consolidatedRecommendations: Recommendation[] = [
      ...busFactorInsight.recommendations,
      ...ownershipInsight.recommendations,
      ...hotspotInsight.recommendations,
      ...activityInsight.recommendations,
    ];

    const executiveSummary = `Repository '${repoName}' is evaluated at overall risk level ${overallRiskLevel} (Health Index: ${overallHealthScore}/100). ${busFactorInsight.summary} ${ownershipInsight.summary}`;

    return {
      repositoryId,
      repositoryName: repoName,
      overallHealthScore,
      overallRiskLevel,
      executiveSummary,
      busFactorInsight,
      ownershipInsight,
      hotspotInsight,
      activityInsight,
      consolidatedRecommendations,
      generatedAt: timestamp,
    };
  }

  /**
   * Generates a multi-repository organizational executive briefing by concurrently
   * evaluating deterministic insights across all tracked workspaces.
   *
   * @returns Complete, immutable ExecutiveSummary report.
   */
  async getExecutiveSummary(): Promise<ExecutiveSummary> {
    const [repos, devs] = await Promise.all([
      this.repository.findRepositories(0, 100),
      this.repository.findDevelopers(undefined, 0, 100),
    ]);

    const timestamp = new Date().toISOString();

    if (repos.length === 0) {
      return {
        totalRepositoriesCount: 0,
        totalDevelopersCount: devs.length,
        overallOrganizationHealthIndex: 100,
        organizationRiskLevel: 'HEALTHY',
        executiveHeadline: 'No repositories currently registered for insight analysis.',
        keyOrganizationalFindings: ['Register and ingest repositories to generate engineering intelligence.'],
        topOrganizationalRisks: [],
        strategicRecommendations: [],
        generatedAt: timestamp,
      };
    }

    // Concurrently evaluate insights for all registered repositories
    const repoInsights = await Promise.all(
      repos.map((repo: Repository) => this.getRepositoryInsights(repo.id)),
    );

    const totalHealth = repoInsights.reduce((sum, r) => sum + r.overallHealthScore, 0);
    const overallOrganizationHealthIndex = Math.round(totalHealth / repoInsights.length);

    let organizationRiskLevel: RiskLevel = 'HEALTHY';
    const hasCritical = repoInsights.some((r) => r.overallRiskLevel === 'CRITICAL');
    const hasHigh = repoInsights.some((r) => r.overallRiskLevel === 'HIGH');

    if (hasCritical || overallOrganizationHealthIndex < 60) {
      organizationRiskLevel = 'CRITICAL';
    } else if (hasHigh || overallOrganizationHealthIndex < 75) {
      organizationRiskLevel = 'HIGH';
    } else if (overallOrganizationHealthIndex < 85) {
      organizationRiskLevel = 'MEDIUM';
    }

    const topOrganizationalRisks = repoInsights
      .filter((r) => r.overallRiskLevel === 'CRITICAL' || r.overallRiskLevel === 'HIGH' || r.overallRiskLevel === 'MEDIUM')
      .sort((a, b) => a.overallHealthScore - b.overallHealthScore)
      .slice(0, 5)
      .map((r) => {
        let factor = 'Multiple architectural risks detected';
        if (r.busFactorInsight.riskLevel === 'CRITICAL' || r.busFactorInsight.riskLevel === 'HIGH') {
          factor = `Severe maintainer concentration (Bus Factor: ${r.busFactorInsight.busFactorScore})`;
        } else if (r.ownershipInsight.riskLevel === 'HIGH') {
          factor = `High code monopoly across ${r.ownershipInsight.totalMonopolizedFiles} files`;
        } else if (r.hotspotInsight.riskLevel === 'HIGH') {
          factor = `Severe code churn in ${r.hotspotInsight.totalHighChurnFiles} files`;
        }
        return {
          repositoryId: r.repositoryId,
          repositoryName: r.repositoryName,
          riskLevel: r.overallRiskLevel,
          primaryRiskFactor: factor,
        };
      });

    const keyOrganizationalFindings: string[] = [
      `Tracked ${repos.length} repositories across ${devs.length} registered contributors.`,
      `Organizational health index is evaluated at ${overallOrganizationHealthIndex}/100 (${organizationRiskLevel}).`,
      `Identified ${topOrganizationalRisks.length} repositories requiring leadership intervention.`,
    ];

    const strategicRecommendations = repoInsights
      .flatMap((r) => r.consolidatedRecommendations)
      .filter((rec) => rec.riskLevel === 'CRITICAL' || rec.riskLevel === 'HIGH')
      .slice(0, 5);

    const executiveHeadline = `Organization is operating at an overall health index of ${overallOrganizationHealthIndex}/100. ${topOrganizationalRisks.length} repositories exhibit high maintainer or churn risks.`;

    return {
      totalRepositoriesCount: repos.length,
      totalDevelopersCount: devs.length,
      overallOrganizationHealthIndex,
      organizationRiskLevel,
      executiveHeadline,
      keyOrganizationalFindings,
      topOrganizationalRisks,
      strategicRecommendations,
      generatedAt: timestamp,
    };
  }
}
