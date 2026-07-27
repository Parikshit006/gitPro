/* ============================================================
   GitPro — Dashboard Query Hooks
   
   TanStack Query hooks for executive dashboard and
   repository detail views.
   ============================================================ */

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  DashboardOverview,
  RepositoryOverview,
  HealthScore,
  ActivityData,
  Hotspot,
  DeveloperNode,
  RepositoryInsight,
} from '../lib/types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  repoBase: (id: string) => [...dashboardKeys.all, 'repository', id] as const,
  repoOverview: (id: string) => [...dashboardKeys.repoBase(id), 'overview'] as const,
  repoHealth: (id: string) => [...dashboardKeys.repoBase(id), 'health'] as const,
  repoActivity: (id: string) => [...dashboardKeys.repoBase(id), 'activity'] as const,
  repoHotspots: (id: string) => [...dashboardKeys.repoBase(id), 'hotspots'] as const,
  repoDevelopers: (id: string) => [...dashboardKeys.repoBase(id), 'developers'] as const,
  repoInsights: (id: string) => [...dashboardKeys.repoBase(id), 'insights'] as const,
};

/* ── Global Dashboard ── */

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: dashboardKeys.overview(),
    queryFn: () => api.get('/dashboard/overview') as Promise<DashboardOverview>,
  });
}

/* ── Repository Detail Tabs ── */

export function useRepositoryOverview(id: string) {
  return useQuery<RepositoryOverview>({
    queryKey: dashboardKeys.repoOverview(id),
    queryFn: () => api.get(`/dashboard/repositories/${id}/overview`) as Promise<RepositoryOverview>,
    enabled: !!id,
  });
}

export function useRepositoryHealth(id: string) {
  return useQuery<HealthScore>({
    queryKey: dashboardKeys.repoHealth(id),
    queryFn: () => api.get(`/dashboard/repositories/${id}/health`) as Promise<HealthScore>,
    enabled: !!id,
  });
}

export function useRepositoryActivity(id: string) {
  return useQuery<ActivityData>({
    queryKey: dashboardKeys.repoActivity(id),
    queryFn: () => api.get(`/dashboard/repositories/${id}/activity`) as Promise<ActivityData>,
    enabled: !!id,
  });
}

export function useRepositoryHotspots(id: string) {
  return useQuery<Hotspot[]>({
    queryKey: dashboardKeys.repoHotspots(id),
    queryFn: () => api.get(`/dashboard/repositories/${id}/hotspots`) as Promise<Hotspot[]>,
    enabled: !!id,
  });
}

export function useRepositoryDevelopers(id: string) {
  return useQuery<DeveloperNode[]>({
    queryKey: dashboardKeys.repoDevelopers(id),
    queryFn: () => api.get(`/dashboard/repositories/${id}/developers`) as Promise<DeveloperNode[]>,
    enabled: !!id,
  });
}

export function useRepositoryInsights(id: string) {
  return useQuery<RepositoryInsight>({
    queryKey: dashboardKeys.repoInsights(id),
    queryFn: () => api.get(`/dashboard/repositories/${id}/insights`) as Promise<RepositoryInsight>,
    enabled: !!id,
  });
}
