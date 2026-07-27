/* ============================================================
   GitPro — Dashboard Page
   ============================================================ */

import { useNavigate } from 'react-router';
import { GitBranch, Users, Activity, ShieldAlert, ArrowRight, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { KPICard } from '../components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { CommitVelocityChart } from '../components/charts/CommitVelocityChart';
import { useDashboardOverview } from '../hooks/useDashboard';
import { getHealthVariant, getRepoStatusVariant, getRepoStatusLabel } from '../lib/statusColors';
import './DashboardPage.css';

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboardOverview();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Executive Dashboard" description="Loading metrics..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height="140px" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2" height="400px" />
          <Skeleton className="lg:col-span-1" height="400px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Executive Dashboard" />
        <ErrorState message="Failed to load dashboard data" details={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data || data.totalRepositories === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Executive Dashboard" />
        <EmptyState 
          icon={LayoutDashboard}
          title="No data available"
          description="Connect a GitHub repository to start seeing metrics and insights."
          action={
            <button onClick={() => navigate('/repositories')} className="btn btn-primary">
              Go to Repositories
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page flex flex-col gap-8">
      <PageHeader 
        title="Executive Dashboard" 
        description="High-level engineering overview across all connected repositories."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Repositories" 
          value={data.totalRepositories} 
          icon={GitBranch} 
          statusText="Tracking"
          statusVariant="neutral"
        />
        <KPICard 
          title="Active Developers" 
          value={data.totalDevelopers} 
          icon={Users}
          statusText="Last 90 days"
          statusVariant="neutral"
        />
        <KPICard 
          title="Avg. Health Score" 
          value={Math.round(data.averageHealthScore)} 
          icon={Activity} 
          statusText={data.averageHealthScore >= 70 ? 'Healthy' : data.averageHealthScore >= 40 ? 'Needs Attention' : 'Critical'}
          statusVariant={getHealthVariant(data.averageHealthScore)}
        />
        <KPICard 
          title="Critical Risks" 
          value={data.criticalRisks} 
          icon={ShieldAlert}
          statusText={data.criticalRisks > 0 ? 'Requires action' : 'All clear'}
          statusVariant={data.criticalRisks > 0 ? 'critical' : 'healthy'}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Activity Chart */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Organization Velocity</CardTitle>
              <p className="text-sm text-muted mt-1">Aggregated commit activity over time</p>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              <CommitVelocityChart data={data.recentActivity} height={350} />
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Top Repositories */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Repositories</CardTitle>
                <p className="text-sm text-muted mt-1">Top by activity</p>
              </div>
              <button 
                onClick={() => navigate('/repositories')}
                className="text-sm text-muted hover:text-[var(--text)] transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-col gap-4">
                {data.repositories.slice(0, 5).map(repo => (
                  <div 
                    key={repo.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/repositories/${repo.id}`)}
                  >
                    <div className="flex flex-col overflow-hidden mr-3">
                      <span className="font-medium text-[var(--text)] truncate">{repo.name}</span>
                      <span className="text-xs text-muted font-mono">{repo.language || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={getHealthVariant(repo.healthScore)}>
                        {Math.round(repo.healthScore)}
                      </Badge>
                      <Badge variant={getRepoStatusVariant(repo.status)} dot={repo.status === 'SYNCING'}>
                        {getRepoStatusLabel(repo.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
