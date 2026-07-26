/**
 * Ownership Metric Plugin
 *
 * Purpose:
 *   Calculates the percentage of code modification ownership per developer for
 *   every tracked file in a repository.
 *   Considers historical commit volume from AUTHORED and MODIFIED edges.
 */

import { IMetricPlugin, EngineeringGraphContext, MetricResultDto } from '../metric.types';

export class OwnershipMetric implements IMetricPlugin {
  readonly name = 'ownership';

  compute(graph: EngineeringGraphContext): MetricResultDto[] {
    const results: MetricResultDto[] = [];

    const devMap = new Map(graph.developers.map((d) => [d.id, d]));

    const commitAuthorMap = new Map<string, string>();
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

    for (const file of graph.fileNodes) {
      const commitIds = fileCommitsMap.get(file.id) || [];
      if (commitIds.length === 0) continue;

      const devCounts = new Map<string, number>();
      let totalFileCommits = 0;

      for (const commitId of commitIds) {
        const devId = commitAuthorMap.get(commitId);
        if (devId) {
          devCounts.set(devId, (devCounts.get(devId) || 0) + 1);
          totalFileCommits++;
        }
      }

      if (totalFileCommits === 0) continue;

      for (const [devId, count] of devCounts.entries()) {
        const dev = devMap.get(devId);
        const percentage = Math.round((count / totalFileCommits) * 10000) / 100; // e.g., 75.25%

        results.push({
          repositoryId: graph.repositoryId,
          metricName: this.name,
          entityType: 'FILE',
          entityId: file.path,
          score: percentage,
          metadata: {
            authorEmail: dev?.email || 'unknown',
            authorName: dev?.name || 'Unknown Developer',
            authorCommits: count,
            totalFileCommits,
          },
        });
      }
    }

    return results;
  }
}
