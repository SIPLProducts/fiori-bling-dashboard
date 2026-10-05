/**
 * Sales reports deliberately keep one committed dataset stable until the user
 * explicitly refreshes it. Remounting after tab or screen navigation must reuse
 * the existing cache without fetching a newer snapshot automatically.
 */
export const STABLE_SALES_QUERY_OPTIONS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false as const,
  refetchOnMount: false,
};

const STABLE_SALES_QUERY_ROOTS = new Set([
  "sd-live-lines",
  "management-sd-lines",
  "zfisales",
  "sd-sales-kpi",
  "net-sales-summary",
]);

export function isStableSalesQuery(queryKey: readonly unknown[]) {
  return typeof queryKey[0] === "string" && STABLE_SALES_QUERY_ROOTS.has(queryKey[0]);
}