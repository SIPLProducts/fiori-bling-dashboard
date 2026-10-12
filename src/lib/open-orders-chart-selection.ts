/** Chart-only limits: full filtered aggregates remain available for totals and PDF. */
export function selectOpenOrderChartGroups<T>(groups: T[], filters: { plants: string[] | null; zones: string[] | null }): T[] {
  return filters.plants !== null || filters.zones !== null ? groups : groups.slice(0, 10);
}
