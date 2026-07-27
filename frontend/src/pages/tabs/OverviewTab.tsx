/* ============================================================
   GitPro — Overview Tab
   ============================================================ */

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useRepositoryOverview } from '../../hooks/useDashboard';
import { FileCode, GitBranch, HardDrive, Hash, Activity } from 'lucide-react';

export function OverviewTab({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, error } = useRepositoryOverview(repositoryId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} height="120px" />)}
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message="Failed to load repository overview" details={error?.message} />;
  }

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const statCards = [
    {
      title: 'Repository Size',
      value: formatSize(data.sizeKb),
      icon: HardDrive,
    },
    {
      title: 'Total Commits',
      value: data.commitCount.toLocaleString(),
      icon: Activity,
    },
    {
      title: 'Default Branch',
      value: data.defaultBranch,
      icon: GitBranch,
      mono: true,
    },
    {
      title: 'Current HEAD',
      value: data.headSha ? data.headSha.slice(0, 7) : 'Unknown',
      icon: Hash,
      mono: true,
    },
    {
      title: 'Primary Language',
      value: data.language || 'Unknown',
      icon: FileCode,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start text-muted">
                <CardTitle className="text-sm font-body">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 opacity-70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-display font-semibold text-text ${stat.mono ? 'font-mono tracking-tight text-2xl' : ''}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
