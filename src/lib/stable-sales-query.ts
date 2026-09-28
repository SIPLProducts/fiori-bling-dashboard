/**
 * Sales reports deliberately keep one committed dataset stable until the user
 * explicitly refreshes it. Remounting after tab or screen navigation must reuse
 * the existing cache without fetching a newer snapshot automatically.
 */
export const STABLE_SALES_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false as const,
  refetchOnMount: false,
};