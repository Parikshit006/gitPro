/* ============================================================
   GitPro — Repositories Page
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, GitBranch, Search, AlertCircle, Clock } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConnectRepositoryModal } from '../components/ConnectRepositoryModal';
import { useRepositories } from '../hooks/useRepositories';
import { getRepoStatusVariant, getRepoStatusLabel } from '../lib/statusColors';
import './RepositoriesPage.css';

export default function RepositoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { data: repositories, isLoading, error, refetch } = useRepositories();

  // Basic client-side filter
  const filteredRepos = repositories?.filter(repo => 
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="repositories-page">
      <PageHeader
        title="Repositories"
        description="Manage connected GitHub repositories and view their engineering health status."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Connect Repository
          </Button>
        }
      />

      <div className="repositories-toolbar">
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="search-input"
        />
      </div>

      {isLoading && (
        <div className="repo-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <Skeleton height="24px" width="60%" className="mb-4" />
              <Skeleton height="16px" width="40%" className="mb-2" />
              <Skeleton height="16px" width="80%" />
            </Card>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <ErrorState
          message="Failed to load repositories"
          details={error.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && filteredRepos.length === 0 && (
        <EmptyState
          icon={GitBranch}
          title={searchQuery ? 'No matching repositories' : 'No repositories connected'}
          description={searchQuery 
            ? `No repositories found matching "${searchQuery}"`
            : "Connect your first GitHub repository to start analyzing engineering metrics and knowledge graphs."
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsModalOpen(true)}>
                Connect Repository
              </Button>
            )
          }
        />
      )}

      {!isLoading && !error && filteredRepos.length > 0 && (
        <div className="repo-grid">
          {filteredRepos.map(repo => (
            <Card 
              key={repo.id} 
              interactive 
              onClick={() => navigate(`/repositories/${repo.id}`)}
              className="repo-card"
            >
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>{repo.name}</CardTitle>
                  <p className="text-muted font-body text-sm mt-1">{repo.owner}</p>
                </div>
                <Badge variant={getRepoStatusVariant(repo.status)} dot={repo.status === 'SYNCING'}>
                  {getRepoStatusLabel(repo.status)}
                </Badge>
              </CardHeader>
              
              <CardContent>
                <div className="repo-meta">
                  {repo.language && (
                    <span className="repo-meta-item">
                      <span className="language-dot" />
                      {repo.language}
                    </span>
                  )}
                  {repo.lastSyncedAt && (
                    <span className="repo-meta-item">
                      <Clock className="w-3 h-3" />
                      {new Date(repo.lastSyncedAt).toLocaleDateString()}
                    </span>
                  )}
                  {repo.status === 'FAILED' && (
                    <span className="repo-meta-item text-critical">
                      <AlertCircle className="w-3 h-3" />
                      Sync failed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConnectRepositoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
