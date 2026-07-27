/* ============================================================
   GitPro — Hotspots Tab
   ============================================================ */

import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRepositoryHotspots } from '../../hooks/useDashboard';
import { GitMerge } from 'lucide-react';
import { getHealthVariant } from '../../lib/statusColors';

export function HotspotsTab({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, error } = useRepositoryHotspots(repositoryId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} height="80px" />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load hotspots" details={error.message} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState 
        icon={GitMerge}
        title="No hotspots detected"
        description="This repository has stable architecture with no significant high-churn complex files."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg">Architectural Hotspots</h3>
        <span className="text-sm text-muted">Showing top {data.length} files</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-4 font-body text-sm font-medium text-muted">File Path</th>
              <th className="p-4 font-body text-sm font-medium text-muted text-right">Complexity</th>
              <th className="p-4 font-body text-sm font-medium text-muted text-right">Frequency</th>
              <th className="p-4 font-body text-sm font-medium text-muted text-right">Risk Score</th>
              <th className="p-4 font-body text-sm font-medium text-muted">Top Contributor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((hotspot, idx) => {
              // Convert 0-1 score to 100-0 health to reuse getHealthVariant (lower score = higher risk in hotspots, wait, if score is risk score, high is bad)
              // Actually, standardizing on a risk score: 1.0 = CRITICAL. So let's map 1.0 -> 0 health
              const pseudoHealth = Math.max(0, 100 - (hotspot.score * 100));
              const variant = getHealthVariant(pseudoHealth);
              
              return (
                <tr key={idx} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="p-4 font-mono text-sm max-w-[300px] truncate" title={hotspot.filePath}>
                    {hotspot.filePath}
                  </td>
                  <td className="p-4 text-sm text-right font-mono">{hotspot.complexity}</td>
                  <td className="p-4 text-sm text-right font-mono">{hotspot.modificationFrequency}</td>
                  <td className="p-4 text-right">
                    <Badge variant={variant}>{(hotspot.score * 100).toFixed(0)}</Badge>
                  </td>
                  <td className="p-4 text-sm truncate max-w-[200px]">
                    {hotspot.topContributor}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
