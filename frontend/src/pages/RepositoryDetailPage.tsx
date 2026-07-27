/* ============================================================
   GitPro — Repository Detail Page
   ============================================================ */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useRepository, useSyncRepository } from '../hooks/useRepositories';
import { getRepoStatusVariant, getRepoStatusLabel } from '../lib/statusColors';

import { OverviewTab } from './tabs/OverviewTab';
import { HealthTab } from './tabs/HealthTab';
import { ActivityTab } from './tabs/ActivityTab';
import { HotspotsTab } from './tabs/HotspotsTab';
import { DevelopersTab } from './tabs/DevelopersTab';
import { InsightsTab } from './tabs/InsightsTab';

export default function RepositoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: repo, isLoading, error } = useRepository(id!);
  const syncMutation = useSyncRepository(id!);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton height="80px" />
        <Skeleton height="40px" />
        <Skeleton height="400px" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={() => navigate('/repositories')} className="w-fit mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Repositories
        </Button>
        <ErrorState 
          message="Failed to load repository details" 
          details={error?.message} 
        />
      </div>
    );
  }

  const handleSync = () => {
    syncMutation.mutate();
  };

  const isSyncing = repo.status === 'SYNCING' || syncMutation.isPending;

  const tabItems = [
    { id: 'overview', label: 'Overview', content: <OverviewTab repositoryId={repo.id} /> },
    { id: 'health', label: 'Health', content: <HealthTab repositoryId={repo.id} /> },
    { id: 'activity', label: 'Activity', content: <ActivityTab repositoryId={repo.id} /> },
    { id: 'hotspots', label: 'Hotspots', content: <HotspotsTab repositoryId={repo.id} /> },
    { id: 'developers', label: 'Developers', content: <DevelopersTab repositoryId={repo.id} /> },
    { id: 'insights', label: 'Insights', content: <InsightsTab repositoryId={repo.id} /> },
  ];

  return (
    <div className="repository-detail-page flex flex-col gap-2">
      <Button variant="ghost" onClick={() => navigate('/repositories')} className="w-fit mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Repositories
      </Button>

      {repo.status === 'FAILED' && (
        <div className="bg-[var(--critical-bg)] border border-[rgba(242,84,91,0.2)] text-[var(--critical)] p-4 rounded-lg flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-body text-sm">
            The last synchronization failed. This might be due to a network error, missing permissions, or a corrupted repository state. Please try syncing again.
          </p>
        </div>
      )}

      <PageHeader
        title={repo.name}
        description={repo.description || `Connected repository from ${repo.owner}`}
        statusBadge={
          <Badge variant={getRepoStatusVariant(repo.status)} dot={isSyncing}>
            {getRepoStatusLabel(repo.status)}
          </Badge>
        }
        actions={
          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            variant="secondary"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        }
      />

      <Tabs 
        items={tabItems} 
        defaultTabId={activeTab} 
        onChange={setActiveTab} 
      />
    </div>
  );
}
