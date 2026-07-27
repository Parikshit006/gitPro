import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UnifiedSearchResponse, SearchEntityType, SortDirection } from '../lib/types';

export function useGlobalSearch(
  query: string,
  type: SearchEntityType = 'ALL',
  page = 1,
  limit = 20,
  sortBy?: string,
  sortOrder: SortDirection = 'desc'
) {
  return useQuery<UnifiedSearchResponse, Error>({
    queryKey: ['search', query, type, page, limit, sortBy, sortOrder],
    queryFn: async () => {
      if (!query && type === 'ALL') {
        return {
          results: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize: limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          executionTimeMs: 0,
        };
      }

      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (type && type !== 'ALL') params.append('type', type);
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      return api.get(`/search?${params.toString()}`) as Promise<UnifiedSearchResponse>;
    },
    enabled: true,
    staleTime: 30000,
  });
}
