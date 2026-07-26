/**
 * Dashboard Mapper (Pure Transformation Layer)
 *
 * Purpose:
 *   Converts raw persistence models and precomputed metric calculation records
 *   into immutable, readonly Dashboard DTOs.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero Express / controller imports.
 *   - Zero database queries, repository calls, or service invocations.
 *   - Zero AppError throws or business workflow decisions.
 *   - All methods must be static, pure, deterministic, and side-effect free.
 */

import {
  DashboardOverview,
  RepositoryCard,
  RepositoryOverview,
  RepositoryHealth,
  RepositoryActivity,
  HotspotSummary,
  OwnershipSummary,
  BusFactorSummary,
  DeveloperSummary,
} from './dashboard.types';

export class DashboardMapper {
  /**
   * Transforms raw metric records into the maintainer concentration BusFactorSummary DTO.
   */
  static toBusFactorSummary(repositoryId: string, metrics: any[]): BusFactorSummary {
    const rec = metrics.find((m) => m.metricName === 'bus-factor' && m.entityType === 'REPOSITORY');
    if (!rec) {
      return {
        repositoryId,
        score: 0,
        riskLevel: 'HIGH',
        totalContributorsCount: 0,
        topContributors: [],
        calculatedAt: new Date().toISOString(),
      };
    }

    const score = Math.round(rec.score);
    const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = score <= 1 ? 'HIGH' : score <= 3 ? 'MEDIUM' : 'LOW';
    const topDevs = (rec.metadata?.topContributors || []).map((c: any, index: number) => ({
      developerId: `dev-${index + 1}`,
      name: c.name || 'Unknown Developer',
      email: c.email || 'unknown',
      contributionPercentage: c.percentage || 0,
    }));

    return {
      repositoryId,
      score,
      riskLevel,
      totalContributorsCount: rec.metadata?.totalCommits ? topDevs.length : 0,
      topContributors: topDevs,
      calculatedAt: rec.calculatedAt ? rec.calculatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Transforms raw metric records into an array of HotspotSummary DTOs.
   */
  static toHotspotSummaries(repositoryId: string, metrics: any[]): ReadonlyArray<HotspotSummary> {
    const hotspotRecs = metrics.filter((m) => m.metricName === 'hotspots' && m.entityType === 'FILE');
    return hotspotRecs.map((rec, idx) => ({
      repositoryId,
      filePath: rec.entityId,
      churnRank: rec.metadata?.rank ?? idx + 1,
      modificationsCount: Math.round(rec.score),
      churnPercentage: rec.metadata?.churnPercentage ?? 0,
      contributorsCount: rec.metadata?.contributorsCount ?? 1,
      calculatedAt: rec.calculatedAt ? rec.calculatedAt.toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Transforms raw metric records into file-level OwnershipSummary DTOs.
   */
  static toOwnershipSummaries(repositoryId: string, metrics: any[]): ReadonlyArray<OwnershipSummary> {
    const ownershipRecs = metrics.filter((m) => m.metricName === 'ownership' && m.entityType === 'FILE');

    // Group raw author ownership records by target file path
    const fileGroups = new Map<string, any[]>();
    for (const rec of ownershipRecs) {
      const list = fileGroups.get(rec.entityId) || [];
      list.push(rec);
      fileGroups.set(rec.entityId, list);
    }

    const summaries: OwnershipSummary[] = [];
    for (const [filePath, recs] of fileGroups.entries()) {
      recs.sort((a, b) => b.score - a.score); // Highest ownership share first
      const primaryRec = recs[0];

      const allContributors = recs.map((r, idx) => ({
        developerId: `dev-${idx + 1}`,
        name: r.metadata?.authorName || 'Unknown Developer',
        email: r.metadata?.authorEmail || 'unknown',
        ownershipPercentage: Math.round(r.score * 100) / 100,
        commitsCount: r.metadata?.authorCommits || 0,
      }));

      summaries.push({
        repositoryId,
        filePath,
        primaryOwner: {
          developerId: 'dev-1',
          name: primaryRec.metadata?.authorName || 'Unknown Developer',
          email: primaryRec.metadata?.authorEmail || 'unknown',
          ownershipPercentage: Math.round(primaryRec.score * 100) / 100,
        },
        allContributors,
        calculatedAt: primaryRec.calculatedAt ? primaryRec.calculatedAt.toISOString() : new Date().toISOString(),
      });
    }

    return summaries;
  }

  /**
   * Synthesizes structural metrics into a RepositoryHealth scorecard DTO.
   */
  static toRepositoryHealth(
    repositoryId: string,
    busFactor: BusFactorSummary,
    hotspots: ReadonlyArray<HotspotSummary>,
    ownership: ReadonlyArray<OwnershipSummary>,
  ): RepositoryHealth {
    let score = 100;

    if (busFactor.score === 1) score -= 30;
    else if (busFactor.score === 2) score -= 15;

    for (const hs of hotspots.slice(0, 5)) {
      if (hs.churnPercentage > 20) score -= 5;
    }

    let knowledgeSiloCount = 0;
    for (const own of ownership) {
      if (own.primaryOwner.ownershipPercentage >= 80) {
        knowledgeSiloCount++;
      }
    }
    score -= Math.min(20, knowledgeSiloCount * 2);

    const overallScore = Math.max(0, Math.min(100, score));
    const status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = overallScore >= 80 ? 'HEALTHY' : overallScore >= 50 ? 'WARNING' : 'CRITICAL';

    return {
      repositoryId,
      overallScore,
      status,
      busFactor,
      topHotspots: hotspots.slice(0, 5),
      knowledgeSiloCount,
      lastAnalyzedAt: busFactor.calculatedAt,
    };
  }

  /**
   * Transforms commit events and file counts into the RepositoryActivity DTO.
   */
  static toRepositoryActivity(repositoryId: string, commits: any[], filesCount: number): RepositoryActivity {
    const activeEmails = new Set<string>();
    const freqMap = new Map<string, number>();
    let latestDate: Date | undefined;

    for (const c of commits) {
      if (c.authorEmail) activeEmails.add(c.authorEmail);
      if (c.committedAt) {
        const d = new Date(c.committedAt);
        if (!latestDate || d > latestDate) latestDate = d;
        const dateStr = d.toISOString().split('T')[0];
        freqMap.set(dateStr, (freqMap.get(dateStr) || 0) + 1);
      }
    }

    const commitFrequency = Array.from(freqMap.entries())
      .map(([date, count]) => ({ date, commitsCount: count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      repositoryId,
      totalCommitsCount: commits.length,
      totalFilesCount: filesCount,
      activeContributorsCount: activeEmails.size,
      commitFrequency,
      lastCommitDate: latestDate ? latestDate.toISOString() : undefined,
    };
  }

  /**
   * Transforms raw developer persistence models into DeveloperSummary DTOs.
   */
  static toDeveloperSummaries(developers: any[], commits: any[] = []): ReadonlyArray<DeveloperSummary> {
    const devCommitCounts = new Map<string, number>();
    const lastDates = new Map<string, Date>();
    const firstDates = new Map<string, Date>();

    for (const c of commits) {
      if (!c.authorEmail) continue;
      devCommitCounts.set(c.authorEmail, (devCommitCounts.get(c.authorEmail) || 0) + 1);
      if (c.committedAt) {
        const d = new Date(c.committedAt);
        const curFirst = firstDates.get(c.authorEmail);
        const curLast = lastDates.get(c.authorEmail);
        if (!curFirst || d < curFirst) firstDates.set(c.authorEmail, d);
        if (!curLast || d > curLast) lastDates.set(c.authorEmail, d);
      }
    }

    return developers.map((dev) => {
      const totalCommits = devCommitCounts.get(dev.email) || 0;
      const first = firstDates.get(dev.email);
      const last = lastDates.get(dev.email);

      return {
        id: dev.id,
        email: dev.email,
        name: dev.name,
        totalCommits,
        activeRepositoriesCount: totalCommits > 0 ? 1 : 0,
        firstContributedAt: first ? first.toISOString() : dev.createdAt.toISOString(),
        lastContributedAt: last ? last.toISOString() : undefined,
      };
    });
  }

  /**
   * Transforms a repository model and health metrics into a RepositoryCard DTO.
   */
  static toRepositoryCard(
    repo: any,
    health: RepositoryHealth,
    busFactorScore: number,
    activeContributorsCount: number,
    totalCommitsCount: number,
  ): RepositoryCard {
    return {
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      url: repo.url,
      healthStatus: health.status,
      healthScore: health.overallScore,
      busFactorScore,
      activeContributorsCount,
      totalCommitsCount,
      lastSyncedAt: repo.lastSyncedAt ? repo.lastSyncedAt.toISOString() : undefined,
    };
  }

  /**
   * Transforms comprehensive repository datasets into the RepositoryOverview DTO.
   */
  static toRepositoryOverview(
    repo: any,
    health: RepositoryHealth,
    activity: RepositoryActivity,
    hotspots: ReadonlyArray<HotspotSummary>,
    ownership: ReadonlyArray<OwnershipSummary>,
    developers: ReadonlyArray<DeveloperSummary>,
  ): RepositoryOverview {
    return {
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      url: repo.url,
      defaultBranch: repo.defaultBranch || 'main',
      isPrivate: repo.isPrivate,
      health,
      activity,
      hotspots,
      ownership,
      developers,
      createdAt: repo.createdAt.toISOString(),
      updatedAt: repo.updatedAt.toISOString(),
      lastSyncedAt: repo.lastSyncedAt ? repo.lastSyncedAt.toISOString() : undefined,
    };
  }

  /**
   * Assembles the executive DashboardOverview DTO from cross-repository summaries.
   */
  static toDashboardOverview(
    reposCount: number,
    devsCount: number,
    repositoryCards: ReadonlyArray<RepositoryCard>,
    recentCommits: any[],
    repos: any[],
  ): DashboardOverview {
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalCommitsAnalyzed = 0;

    for (const card of repositoryCards) {
      if (card.healthStatus === 'HEALTHY') healthyCount++;
      else if (card.healthStatus === 'WARNING') warningCount++;
      else if (card.healthStatus === 'CRITICAL') criticalCount++;
      totalCommitsAnalyzed += card.totalCommitsCount;
    }

    const recentActivity = recentCommits.map((commit: any) => ({
      repositoryId: commit.repositoryId,
      repositoryName: repos.find((r: any) => r.id === commit.repositoryId)?.name || 'Unknown Repository',
      description: `Commit by ${commit.authorName}: ${commit.message.slice(0, 60)}`,
      timestamp: commit.committedAt ? commit.committedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      totalRepositoriesCount: reposCount,
      totalDevelopersCount: devsCount,
      totalCommitsAnalyzed,
      healthyRepositoriesCount: healthyCount,
      warningRepositoriesCount: warningCount,
      criticalRepositoriesCount: criticalCount,
      repositories: repositoryCards,
      recentActivity,
    };
  }
}
