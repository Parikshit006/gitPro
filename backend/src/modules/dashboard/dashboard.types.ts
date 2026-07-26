/**
 * Dashboard Domain Contracts (Frontend-Facing DTOs)
 *
 * Purpose:
 *   Defines pure, frontend-facing Data Transfer Objects (DTOs) and API contract
 *   structures for the GitPro Engineering Intelligence Platform dashboard.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports.
 *   - Zero Express / controller imports.
 *   - Zero business logic or method implementations.
 *   - Readonly properties to enforce immutability across serialization boundaries.
 */

export interface DeveloperSummary {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly totalCommits: number;
  readonly activeRepositoriesCount: number;
  readonly firstContributedAt?: string;
  readonly lastContributedAt?: string;
}

export interface BusFactorSummary {
  readonly repositoryId: string;
  readonly score: number; // The bus factor integer count
  readonly riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly totalContributorsCount: number;
  readonly topContributors: ReadonlyArray<{
    readonly developerId: string;
    readonly name: string;
    readonly email: string;
    readonly contributionPercentage: number;
  }>;
  readonly calculatedAt: string;
}

export interface OwnershipSummary {
  readonly repositoryId: string;
  readonly filePath: string;
  readonly primaryOwner: {
    readonly developerId: string;
    readonly name: string;
    readonly email: string;
    readonly ownershipPercentage: number;
  };
  readonly allContributors: ReadonlyArray<{
    readonly developerId: string;
    readonly name: string;
    readonly email: string;
    readonly ownershipPercentage: number;
    readonly commitsCount: number;
  }>;
  readonly calculatedAt: string;
}

export interface HotspotSummary {
  readonly repositoryId: string;
  readonly filePath: string;
  readonly churnRank: number;
  readonly modificationsCount: number;
  readonly churnPercentage: number; // e.g. 15.42 for 15.42% of total repository churn
  readonly contributorsCount: number;
  readonly calculatedAt: string;
}

export interface RepositoryHealth {
  readonly repositoryId: string;
  readonly overallScore: number; // 0-100 health index
  readonly status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  readonly busFactor: BusFactorSummary;
  readonly topHotspots: ReadonlyArray<HotspotSummary>;
  readonly knowledgeSiloCount: number; // Count of files owned >= 80% by a single developer
  readonly lastAnalyzedAt: string;
}

export interface RepositoryActivity {
  readonly repositoryId: string;
  readonly totalCommitsCount: number;
  readonly totalFilesCount: number;
  readonly activeContributorsCount: number;
  readonly commitFrequency: ReadonlyArray<{
    readonly date: string; // ISO-8601 date string (YYYY-MM-DD)
    readonly commitsCount: number;
  }>;
  readonly lastCommitDate?: string;
}

export interface RepositoryOverview {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly url: string;
  readonly defaultBranch: string;
  readonly isPrivate: boolean;
  readonly health: RepositoryHealth;
  readonly activity: RepositoryActivity;
  readonly hotspots: ReadonlyArray<HotspotSummary>;
  readonly ownership: ReadonlyArray<OwnershipSummary>;
  readonly developers: ReadonlyArray<DeveloperSummary>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSyncedAt?: string;
}

export interface RepositoryCard {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly url: string;
  readonly healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  readonly healthScore: number;
  readonly busFactorScore: number;
  readonly activeContributorsCount: number;
  readonly totalCommitsCount: number;
  readonly lastSyncedAt?: string;
}

export interface DashboardOverview {
  readonly totalRepositoriesCount: number;
  readonly totalDevelopersCount: number;
  readonly totalCommitsAnalyzed: number;
  readonly healthyRepositoriesCount: number;
  readonly warningRepositoriesCount: number;
  readonly criticalRepositoriesCount: number;
  readonly repositories: ReadonlyArray<RepositoryCard>;
  readonly recentActivity: ReadonlyArray<{
    readonly repositoryId: string;
    readonly repositoryName: string;
    readonly description: string;
    readonly timestamp: string;
  }>;
}

export interface DashboardResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly timestamp: string;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
