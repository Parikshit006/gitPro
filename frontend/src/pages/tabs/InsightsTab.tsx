/* ============================================================
   GitPro — Insights Tab
   ============================================================ */

import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecommendationCard } from '../../components/ui/RecommendationCard';
import { Badge } from '../../components/ui/Badge';
import { useRepositoryInsights } from '../../hooks/useDashboard';
import { getRiskVariant, getRiskLabel } from '../../lib/statusColors';
import { Sparkles, ShieldAlert, GitMerge, Users, Activity } from 'lucide-react';
import type { RiskLevel, Recommendation } from '../../lib/types';

export function InsightsTab({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, error } = useRepositoryInsights(repositoryId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton height="150px" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton height="300px" />
          <Skeleton height="300px" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load AI insights" details={error.message} />;
  }

  if (!data) {
    return (
      <EmptyState 
        icon={Sparkles}
        title="No insights available"
        description="Engineering insights have not been generated for this repository yet. Run a sync to process the data."
      />
    );
  }

  const renderSection = (title: string, icon: React.ReactNode, riskLevel: RiskLevel, summary: string, recommendations: readonly Recommendation[]) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-[var(--${getRiskVariant(riskLevel)}-bg)] text-[var(--${getRiskVariant(riskLevel)})]`}>
            {icon}
          </div>
          <h3 className="font-display text-lg m-0">{title}</h3>
        </div>
        <Badge variant={getRiskVariant(riskLevel)}>{getRiskLabel(riskLevel)} Risk</Badge>
      </div>
      
      <p className="text-muted font-body leading-relaxed">{summary}</p>
      
      {recommendations && recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-2">
          {recommendations.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-10 pb-8">
      {/* Executive Summary */}
      <div className="glass-surface p-6 flex flex-col gap-4 border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[var(--healthy)]" />
          <h2 className="font-display text-xl text-[var(--text)] m-0">AI Executive Summary</h2>
          <Badge variant={getRiskVariant(data.overallRiskLevel)} className="ml-auto">
            Overall: {getRiskLabel(data.overallRiskLevel)} Risk
          </Badge>
        </div>
        <p className="text-lg leading-relaxed text-muted font-body">
          {data.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-x-12 lg:gap-y-10">
        {renderSection('Knowledge Distribution', <ShieldAlert className="w-5 h-5" />, data.busFactor.riskLevel, data.busFactor.summary, data.busFactor.recommendations)}
        {renderSection('Code Ownership', <Users className="w-5 h-5" />, data.ownership.riskLevel, data.ownership.summary, data.ownership.recommendations)}
        {renderSection('Architectural Hotspots', <GitMerge className="w-5 h-5" />, data.hotspots.riskLevel, data.hotspots.summary, data.hotspots.recommendations)}
        {renderSection('Activity Patterns', <Activity className="w-5 h-5" />, data.activity.riskLevel, data.activity.summary, data.activity.recommendations)}
      </div>
    </div>
  );
}
