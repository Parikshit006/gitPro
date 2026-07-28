/* ============================================================
   GitPro — Authentication & Session Hook
   
   TanStack Query hook for retrieving authenticated user profile
   and mutation for logging out (clearing HttpOnly cookie).
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { User } from '../lib/types';

export function useAuth() {
  return useQuery<User, Error>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me') as Promise<User>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
    onError: () => {
      // Even if API call fails, redirect to login
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}
