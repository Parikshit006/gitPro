/**
 * Hotspot Metric Plugin
 *
 * Purpose:
 *   Ranks repository files by modification frequency (churn).
 *   High-churn files represent development hotspots where bugs and merge conflicts
 *   are statistically most likely to occur.
 *   Utilizes linear counting and priority sorting without recursive traversals.
 */

import { IMetricPlugin, EngineeringGraphContext, MetricResultDto } from '../metric.types';

export class HotspotMetric implements IMetricPlugin {
  readonly name = 'hotspots';

  compute(graph: EngineeringGraphContext): MetricResultDto[] {
    const results: MetricResultDto[] = [];

    // Map file node ID to modification count from MODIFIED edges
    const fileModificationCounts = new Map<string, number>();
    let totalModifications = 0;

    for (const edge of graph.edges) {
      if (edge.type === 'MODIFIED') {
        const current = fileModificationCounts.get(edge.targetId) || 0;
        fileModificationCounts.set(edge.targetId, current + 1);
        totalModifications++;
      }
    }

    if (totalModifications === 0) {
      return results;
    }

    // Pair files with their churn count and sort descending (priority ranking)
    const rankedFiles: Array<{ path: string; count: number }> = [];
    for (const file of graph.fileNodes) {
      const count = fileModificationCounts.get(file.id) || 0;
      if (count > 0) {
        rankedFiles.push({ path: file.path, count });
      }
    }

    rankedFiles.sort((a, b) => b.count - a.count);

    for (let i = 0; i < rankedFiles.length; i++) {
      const item = rankedFiles[i];
      const churnPercentage = Math.round((item.count / totalModifications) * 10000) / 100;

      results.push({
        repositoryId: graph.repositoryId,
        metricName: this.name,
        entityType: 'FILE',
        entityId: item.path,
        score: item.count,
        metadata: {
          rank: i + 1,
          churnPercentage,
          modificationsCount: item.count,
          totalRepositoryModifications: totalModifications,
        },
      });
    }

    return results;
  }
}
