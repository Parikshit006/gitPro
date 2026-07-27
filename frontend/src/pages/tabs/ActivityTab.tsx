/* ============================================================
   GitPro — Activity Tab
   ============================================================ */

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { CommitVelocityChart } from '../../components/charts/CommitVelocityChart';
import { useRepositoryActivity } from '../../hooks/useDashboard';

export function ActivityTab({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, error } = useRepositoryActivity(repositoryId);

  if (isLoading) {
    return <Skeleton height="400px" />;
  }

  if (error || !data) {
    return <ErrorState message="Failed to load activity metrics" details={error?.message} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Commit Velocity</CardTitle>
          <p className="text-sm text-muted mt-1">Daily commit volume over the last {data.periodDays} days ({data.totalCommits} total)</p>
        </CardHeader>
        <CardContent>
          <CommitVelocityChart data={data.timeline} height={350} />
        </CardContent>
      </Card>
    </div>
  );
}
