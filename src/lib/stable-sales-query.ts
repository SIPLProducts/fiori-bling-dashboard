/**
 * Sales reports deliberately keep one committed dataset stable while open.
 * `always` is required here because `true` only refetches stale queries, while
 * these queries intentionally remain fresh forever during the active mount.
 */
export const STABLE_SALES_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchOnMount: "always" as const,
};