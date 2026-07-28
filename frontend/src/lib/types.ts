/* ============================================================
   GitPro — Shared TypeScript Types
   
   All frontend interfaces matching backend DTO contracts.
   Single source of truth for the entire UI application.
   ============================================================ */

/* ── User ── */

export interface User {
  readonly id: string;
  readonly githubId: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly avatarUrl: string | null;
}

/* ── Repository ── */

export type RepositoryStatus = 'REGISTERED' | 'SYNCING' | 'READY' | 'FAILED';

export interface Repository {
  readonly id: string;
  readonly githubId: number;
  readonly owner: string;
  readonly name: string;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly visibility: string;
  readonly cloneUrl: string;
  readonly sizeKb: number;
  readonly language: string | null;
  readonly description: string | null;
  readonly status: RepositoryStatus;
  readonly lastSyncedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/* ── Dashboard ── */

export interface DashboardOverview {
  readonly totalRepositories: number;
  readonly totalDevelopers: number;
  readonly averageHealthScore: number;
  readonly criticalRisks: number;
  readonly repositories: readonly RepositorySummary[];
  readonly recentActivity: readonly ActivityEntry[];
}

export interface RepositorySummary {
  readonly id: string;
  readonly name: string;
  readonly fullName: string;
  readonly owner: string;
  readonly language: string | null;
  readonly status: RepositoryStatus;
  readonly healthScore: number;
  readonly lastActivity: string | null;
  readonly commitCount: number;
}

export interface ActivityEntry {
  readonly date: string;
  readonly commits: number;
  readonly repositoryName?: string;
}

export interface RepositoryOverview {
  readonly id: string;
  readonly name: string;
  readonly fullName: string;
  readonly owner: string;
  readonly defaultBranch: string;
  readonly language: string | null;
  readonly sizeKb: number;
  readonly commitCount: number;
  readonly headSha: string;
  readonly lastSyncedAt: string | null;
  readonly status: RepositoryStatus;
}

export interface HealthScore {
  readonly overallScore: number;
  readonly breakdown: readonly HealthBreakdownItem[];
}

export interface HealthBreakdownItem {
  readonly category: string;
  readonly score: number;
  readonly label: string;
  readonly description: string;
}

export interface ActivityData {
  readonly timeline: readonly ActivityEntry[];
  readonly contributors: readonly ContributorSummary[];
  readonly totalCommits: number;
  readonly periodDays: number;
}

export interface ContributorSummary {
  readonly name: string;
  readonly email: string;
  readonly commitCount: number;
  readonly percentage: number;
}

export interface Hotspot {
  readonly filePath: string;
  readonly modificationFrequency: number;
  readonly complexity: number;
  readonly score: number;
  readonly lastModified: string;
  readonly topContributor: string;
}

export interface DeveloperNode {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly commitCount: number;
  readonly ownershipPercentage: number;
  readonly filesOwned: number;
}

/* ── Insights ── */

export type RiskLevel = 'HEALTHY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RepositoryInsight {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly overallRiskLevel: RiskLevel;
  readonly summary: string;
  readonly generatedAt: string;
  readonly busFactor: BusFactorInsight;
  readonly ownership: OwnershipInsight;
  readonly hotspots: HotspotInsight;
  readonly activity: ActivityInsight;
}

export interface BusFactorInsight {
  readonly score: number;
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: readonly string[];
  readonly recommendations: readonly Recommendation[];
  readonly topContributors: readonly ContributorSummary[];
}

export interface OwnershipInsight {
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: readonly string[];
  readonly recommendations: readonly Recommendation[];
}

export interface HotspotInsight {
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: readonly string[];
  readonly recommendations: readonly Recommendation[];
  readonly topHotspots: readonly Hotspot[];
}

export interface ActivityInsight {
  readonly riskLevel: RiskLevel;
  readonly summary: string;
  readonly keyFindings: readonly string[];
  readonly recommendations: readonly Recommendation[];
}

export interface Recommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly riskLevel: RiskLevel;
  readonly actionItems: readonly string[];
}

/* ── Sync ── */

export interface SyncResult {
  readonly status: 'FIRST_SYNC' | 'UPDATED' | 'NO_CHANGES';
  readonly repositoryId: string;
  readonly oldHead: string | null;
  readonly newHead: string;
  readonly commitCount: number;
  readonly message: string;
}

/* ── Reports ── */

export type ReportClassification =
  | 'EXECUTIVE'
  | 'REPOSITORY'
  | 'DEVELOPER'
  | 'ORGANIZATION'
  | 'WEEKLY'
  | 'MONTHLY';

export type ReportFormat = 'pdf' | 'html' | 'markdown' | 'json';

/* ── Notifications ── */

export type NotificationChannel = 'email' | 'slack' | 'webhook';

export interface NotificationRequest {
  readonly recipient: string;
  readonly subject?: string;
  readonly report?: unknown;
  readonly reportResult?: unknown;
  readonly fallbackChannel?: NotificationChannel;
  readonly metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  readonly status: 'DELIVERED' | 'FAILED' | 'PARTIAL';
  readonly channel: NotificationChannel;
  readonly recipient: string;
  readonly deliveredAt?: string;
  readonly error?: string;
}

/* ── Search ── */

export type SearchEntityType = 'REPOSITORY' | 'DEVELOPER' | 'HEALTH' | 'HOTSPOT' | 'OWNERSHIP' | 'INSIGHT' | 'ALL';
export type SortDirection = 'asc' | 'desc';

export interface PaginationMetadata {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface SearchResultItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly type: SearchEntityType;
  readonly url: string;
  readonly score?: number;
  readonly badge?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface UnifiedSearchResponse {
  readonly results: readonly SearchResultItem[];
  readonly pagination: PaginationMetadata;
  readonly executionTimeMs: number;
}

/* ── AI ── */

export interface AIResponse {
  readonly content: string;
  readonly provider: string;
  readonly modelName: string;
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
  readonly promptVersion?: string;
  readonly responseVersion?: string;
}

export interface AIProviderStatus {
  readonly provider: string;
  readonly modelName: string;
  readonly timeoutMs: number;
  readonly retries: number;
  readonly promptVersion: string;
  readonly responseVersion: string;
  readonly fallbackProvider: string;
}

export interface AIChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'ai';
  readonly content: string;
  readonly timestamp: string;
  readonly riskLevel?: RiskLevel;
  readonly recommendations?: readonly string[];
}

/* ── API Envelope ── */

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
}

export interface ApiError {
  readonly success: false;
  readonly message: string;
  readonly stack?: string;
}

