/* ============================================================
   GitPro — Repository Query Hooks
   
   TanStack Query hooks for repository CRUD, sync with 
   optimistic updates, and polling during SYNCING state.
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Repository, SyncResult } from '../lib/types';

/* ── Query Keys ── */

export const repoKeys = {
  all: ['repositories'] as const,
  detail: (id: string) => ['repository', id] as const,
};

/* ── List All Repositories ── */

export function useRepositories() {
  return useQuery<Repository[]>({
    queryKey: repoKeys.all,
    queryFn: () => api.get('/repositories') as Promise<Repository[]>,
  });
}

/* ── Single Repository (with auto-poll when SYNCING) ── */

export function useRepository(id: string) {
  return useQuery<Repository>({
    queryKey: repoKeys.detail(id),
    queryFn: () => api.get(`/repositories/${id}`) as Promise<Repository>,
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state?.data as Repository | undefined;
      return data?.status === 'SYNCING' ? 2500 : false;
    },
  });
}

/* ── Create Repository ── */

export function useCreateRepository() {
  const queryClient = useQueryClient();

  return useMutation<Repository, Error, { cloneUrl: string }>({
    mutationFn: (body) => api.post('/repositories', body) as Promise<Repository>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repoKeys.all });
    },
  });
}

/* ── Sync Repository (Optimistic Update) ── */

export function useSyncRepository(id: string) {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error>({
    mutationFn: () => api.post(`/repositories/${id}/sync`) as Promise<SyncResult>,

    onMutate: async () => {
      /* Cancel in-flight refetches */
      await queryClient.cancelQueries({ queryKey: repoKeys.detail(id) });

      /* Snapshot previous value for rollback */
      const previous = queryClient.getQueryData<Repository>(repoKeys.detail(id));

      /* Optimistically set status to SYNCING */
      if (previous) {
        queryClient.setQueryData<Repository>(repoKeys.detail(id), {
          ...previous,
          status: 'SYNCING',
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      /* Rollback on failure */
      const ctx = context as { previous?: Repository } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(repoKeys.detail(id), ctx.previous);
      }
    },

    onSettled: () => {
      /* Trigger refetch to get actual state */
      queryClient.invalidateQueries({ queryKey: repoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: repoKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
