/* ============================================================
   GitPro — Developers Tab
   ============================================================ */

import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRepositoryDevelopers } from '../../hooks/useDashboard';
import { Users } from 'lucide-react';

export function DevelopersTab({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, error } = useRepositoryDevelopers(repositoryId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height="120px" />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load developers" details={error.message} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState 
        icon={Users}
        title="No developers found"
        description="No commit authors could be extracted from this repository."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg">Engineering Graph</h3>
        <span className="text-sm text-muted">{data.length} total contributors</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(dev => (
          <Card key={dev.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center font-display font-semibold text-[var(--text)]">
                {dev.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate overflow-hidden">
                <span className="font-semibold text-[var(--text)] truncate">{dev.name}</span>
                <span className="text-xs text-muted font-mono truncate">{dev.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-[var(--border-subtle)] text-center">
              <div className="flex flex-col">
                <span className="text-lg font-mono text-[var(--text)]">{dev.commitCount}</span>
                <span className="text-xs text-muted uppercase tracking-wider">Commits</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-mono text-[var(--text)]">{dev.filesOwned}</span>
                <span className="text-xs text-muted uppercase tracking-wider">Files</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-mono text-[var(--healthy)]">{Math.round(dev.ownershipPercentage)}%</span>
                <span className="text-xs text-muted uppercase tracking-wider">Owned</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
