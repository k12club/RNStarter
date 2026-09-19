import { QueryCache, QueryClient, MutationCache } from '@tanstack/react-query';

import { isApiError, toApiError } from '@/services/api/errors';
import { logger } from '@/utils/logger';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.warn('query error', query.queryKey, toApiError(error).message);
    },
  }),
  mutationCache: new MutationCache({
    onError: error => {
      logger.warn('mutation error', toApiError(error).message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      // retry เฉพาะ error ที่ลองใหม่แล้วมีโอกาสสำเร็จ (network / timeout / 5xx)
      retry: (failureCount, error) =>
        failureCount < MAX_RETRIES && (!isApiError(error) || error.isRetryable),
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
});
