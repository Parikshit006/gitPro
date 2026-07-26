/**
 * Insight Domain Contracts (`src/modules/insights/insight.types.ts`)
 *
 * Purpose:
 *   Defines pure, frontend-facing readonly Data Transfer Object (DTO) contracts
 *   for the GitPro Engineering Insights module. This layer synthesizes precomputed
 *   metrics (Bus Factor, Hotspots, Code Ownership, and Activity) into deterministic,
 *   actionable engineering explanations and actionable organizational recommendations.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero Express / HTTP controller imports.
 *   - Zero runtime implementation, algorithmic logic, or LLM/OpenAI invocations.
 *   - All interfaces and types must be strictly readonly, immutable, and JSON serializable.
 */

/**
 * Standardized risk severity rating across all organizational and repository insights.
 */
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY' | 'INFO';

/**
 * Represents an actionable engineering intervention derived deterministically
 * from underlying metric thresholds.
 */
export interface Recommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly riskLevel: RiskLevel;
  readonly actionItems: ReadonlyArray<string>;
  readonly targetEntity?: {
    readonly type: 'REPOSITORY' | 'FILE' | 'DEVELOPER';
    readonly id: string;
    readonly name: string;
  };
  readonly generatedAt: string;
}

/**
 * Explains maintainer concentration risks and knowledge distribution bottlenecks
 * derived from the Bus Factor metric calculation.
 */
export interface BusFactorInsight {
  readonly repositoryId: string;
  readonly busFactorScore: number;
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: ReadonlyArray<string>;
  readonly siloedDevelopers: ReadonlyArray<{
    readonly developerId: string;
    readonly name: string;
    readonly email: string;
    readonly riskContribution: string;
  }>;
  readonly recommendations: ReadonlyArray<Recommendation>;
  readonly generatedAt: string;
}

/**
 * Explains code monopoly risks and authorship concentration across repository files
 * derived from precomputed ownership metrics.
 */
export interface OwnershipInsight {
  readonly repositoryId: string;
  readonly totalMonopolizedFiles: number;
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: ReadonlyArray<string>;
  readonly criticalSilos: ReadonlyArray<{
    readonly filePath: string;
    readonly primaryOwner: string;
    readonly ownershipPercentage: number;
    readonly riskExplanation: string;
  }>;
  readonly recommendations: ReadonlyArray<Recommendation>;
  readonly generatedAt: string;
}

/**
 * Explains code instability, churn severity, and modification frequency hazards
 * derived from precomputed file hotspot calculations.
 */
export interface HotspotInsight {
  readonly repositoryId: string;
  readonly totalHighChurnFiles: number;
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: ReadonlyArray<string>;
  readonly topCriticalHotspots: ReadonlyArray<{
    readonly filePath: string;
    readonly churnRank: number;
    readonly modificationsCount: number;
    readonly churnPercentage: number;
    readonly riskExplanation: string;
  }>;
  readonly recommendations: ReadonlyArray<Recommendation>;
  readonly generatedAt: string;
}

/**
 * Explains development velocity, throughput cadence, and contributor engagement trends.
 */
export interface ActivityInsight {
  readonly repositoryId: string;
  readonly totalCommitsAnalyzed: number;
  readonly activeContributorsCount: number;
  readonly developmentPace: 'ACCELERATING' | 'STABLE' | 'DECELERATING' | 'STAGNANT';
  readonly summary: string;
  readonly keyFindings: ReadonlyArray<string>;
  readonly recommendations: ReadonlyArray<Recommendation>;
  readonly generatedAt: string;
}

/**
 * High-level executive synthesis across all tracked organizational repositories.
 * Designed for VP of Engineering and Engineering Manager dashboards.
 */
export interface ExecutiveSummary {
  readonly totalRepositoriesCount: number;
  readonly totalDevelopersCount: number;
  readonly overallOrganizationHealthIndex: number;
  readonly organizationRiskLevel: RiskLevel;
  readonly executiveHeadline: string;
  readonly keyOrganizationalFindings: ReadonlyArray<string>;
  readonly topOrganizationalRisks: ReadonlyArray<{
    readonly repositoryId: string;
    readonly repositoryName: string;
    readonly riskLevel: RiskLevel;
    readonly primaryRiskFactor: string;
  }>;
  readonly strategicRecommendations: ReadonlyArray<Recommendation>;
  readonly generatedAt: string;
}

/**
 * Comprehensive, multi-dimensional engineering intelligence report for a single repository.
 * Aggregates all specialized deterministic insights into a cohesive workspace evaluation.
 */
export interface RepositoryInsight {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly overallHealthScore: number;
  readonly overallRiskLevel: RiskLevel;
  readonly executiveSummary: string;
  readonly busFactorInsight: BusFactorInsight;
  readonly ownershipInsight: OwnershipInsight;
  readonly hotspotInsight: HotspotInsight;
  readonly activityInsight: ActivityInsight;
  readonly consolidatedRecommendations: ReadonlyArray<Recommendation>;
  readonly generatedAt: string;
}

/**
 * Standardized API response envelope for Insight endpoints.
 */
export interface InsightResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly timestamp: string;
  readonly data: T;
}
