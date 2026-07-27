import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AIResponse, AIProviderStatus } from '../lib/types';

export function useAIStatus() {
  return useQuery<AIProviderStatus, Error>({
    queryKey: ['ai', 'status'],
    queryFn: () => api.get('/ai/status') as Promise<AIProviderStatus>,
    staleTime: 60000,
  });
}

export function useAIChat() {
  return useMutation<AIResponse, Error, { prompt: string }>({
    mutationFn: ({ prompt }) => api.post('/ai/chat', { prompt }) as Promise<AIResponse>,
  });
}

export function useAIExplain() {
  return useMutation<AIResponse, Error, { context: unknown; target: string }>({
    mutationFn: ({ context, target }) => api.post('/ai/explain', { context, target }) as Promise<AIResponse>,
  });
}
