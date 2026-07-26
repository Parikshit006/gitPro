/**
 * Bus Factor Metric Plugin
 *
 * Purpose:
 *   Calculates maintainer concentration across a repository and individual files.
 *   Bus Factor represents the minimum number of developers whose combined
 *   contributions account for >= 50% of total modifications.
 *   A low score (e.g., 1) indicates a high engineering risk (knowledge silo).
 */

import { IMetricPlugin, EngineeringGraphContext, MetricResultDto } from '../metric.types';

export class BusFactorMetric implements IMetricPlugin {
  readonly name = 'bus-factor';
  private readonly threshold = 0.5; // 50% contribution threshold

  compute(graph: EngineeringGraphContext): MetricResultDto[] {
    const results: MetricResultDto[] = [];

    // Map developer ID to developer DTO for metadata resolution
    const devMap = new Map(graph.developers.map((d) => [d.id, d]));

    // Map commit node ID to author developer ID from AUTHORED edges
    const commitAuthorMap = new Map<string, string>();
    // Map file node ID to modifying commit IDs from MODIFIED edges
    const fileCommitsMap = new Map<string, string[]>();

    for (const edge of graph.edges) {
      if (edge.type === 'AUTHORED') {
        commitAuthorMap.set(edge.targetId, edge.sourceId);
      } else if (edge.type === 'MODIFIED') {
        const existing = fileCommitsMap.get(edge.targetId) || [];
        existing.push(edge.sourceId);
        fileCommitsMap.set(edge.targetId, existing);
      }
    }

    // 1. Calculate Repository-Level Bus Factor
    const repoDevCounts = new Map<string, number>();
    for (const commit of graph.commitNodes) {
      const devId = commitAuthorMap.get(commit.id);
      if (devId) {
        repoDevCounts.set(devId, (repoDevCounts.get(devId) || 0) + 1);
      }
    }

    const repoResult = this.calculateConcentration(
      graph.repositoryId,
      'REPOSITORY',
      graph.repositoryId,
      repoDevCounts,
      devMap,
    );
    if (repoResult) {
      results.push(repoResult);
    }

    // 2. Calculate Per-File Bus Factor
    for (const file of graph.fileNodes) {
      const commitIds = fileCommitsMap.get(file.id) || [];
      if (commitIds.length === 0) continue;

      const fileDevCounts = new Map<string, number>();
      for (const commitId of commitIds) {
        const devId = commitAuthorMap.get(commitId);
        if (devId) {
          fileDevCounts.set(devId, (fileDevCounts.get(devId) || 0) + 1);
        }
      }

      const fileResult = this.calculateConcentration(
        graph.repositoryId,
        'FILE',
        file.path,
        fileDevCounts,
        devMap,
      );
      if (fileResult) {
        results.push(fileResult);
      }
    }

    return results;
  }

  private calculateConcentration(
    repositoryId: string,
    entityType: string,
    entityId: string,
    devCounts: Map<string, number>,
    devMap: Map<string, any>,
  ): MetricResultDto | null {
    let totalCommits = 0;
    for (const count of devCounts.values()) {
      totalCommits += count;
    }
    if (totalCommits === 0) return null;

    // Sort developers by commit volume descending
    const sortedDevs = Array.from(devCounts.entries()).sort((a, b) => b[1] - a[1]);

    let accumulated = 0;
    let busFactor = 0;
    const topContributors = [];

    for (const [devId, count] of sortedDevs) {
      accumulated += count;
      busFactor++;
      const dev = devMap.get(devId);
      const percentage = Math.round((count / totalCommits) * 10000) / 100;
      topContributors.push({
        email: dev?.email || 'unknown',
        name: dev?.name || 'Unknown Developer',
        commits: count,
        percentage,
      });

      if (accumulated >= totalCommits * this.threshold) {
        break;
      }
    }

    return {
      repositoryId,
      metricName: this.name,
      entityType,
      entityId,
      score: busFactor,
      metadata: {
        threshold: `${this.threshold * 100}%`,
        totalCommits,
        topContributors,
      },
    };
  }
}
