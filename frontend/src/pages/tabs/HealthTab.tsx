/* ============================================================
   GitPro — Health Tab
   ============================================================ */

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { HealthGauge } from '../../components/charts/HealthGauge';
import { useRepositoryHealth } from '../../hooks/useDashboard';
import { Activity, ShieldAlert, GitMerge } from 'lucide-react';
import { getHealthVariant, getVariantColor } from '../../lib/statusColors';

export function HealthTab({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, error } = useRepositoryHealth(repositoryId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex justify-center p-8"><Skeleton circle width="200px" height="200px" /></div>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message="Failed to load health metrics" details={error?.message} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 flex flex-col items-center justify-center p-8">
        <CardHeader className="text-center w-full">
          <CardTitle>Overall Health</CardTitle>
          <p className="text-muted text-sm mt-1">Aggregated structural engineering score</p>
        </CardHeader>
        <CardContent className="w-full flex justify-center py-6">
          <HealthGauge score={Math.round(data.overallScore)} />
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <h3 className="font-display text-lg text-text mb-2">Structural Breakdown</h3>
        {data.breakdown.map((item, idx) => {
          const variant = getHealthVariant(item.score);
          const color = getVariantColor(variant);
          
          let Icon = Activity;
          if (item.category.toLowerCase().includes('bus')) Icon = ShieldAlert;
          if (item.category.toLowerCase().includes('hotspot')) Icon = GitMerge;

          return (
            <Card key={idx} className="flex items-start gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `var(--${variant}-bg)`, color }}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-body font-semibold text-text">{item.label}</h4>
                  <span className="font-mono font-bold" style={{ color }}>{Math.round(item.score)}/100</span>
                </div>
                <p className="text-sm text-muted">{item.description}</p>
                <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.max(5, item.score)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
