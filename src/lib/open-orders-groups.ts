export type GroupRow = { order: string; value: number; division: string; industryDescription?: string };
export type GroupSummary = { name: string; value: number; orders: number; divisions: string[] };

/** Groups rows by key; counts distinct order numbers and lists related divisions. Sorted by value desc. */
export function summarizeOpenOrderGroups<T extends GroupRow>(rows: T[], key: (row: T) => string): GroupSummary[] {
  const map = new Map<string, { value: number; orders: Set<string>; divisions: Set<string> }>();
  for (const row of rows) {
    const name = key(row).trim();
    if (!name) continue;
    const entry = map.get(name) ?? { value: 0, orders: new Set(), divisions: new Set() };
    entry.value += row.value;
    entry.orders.add(row.order);
    const division = row.division?.trim();
    if (division && division !== "Unassigned") entry.divisions.add(row.industryDescription ? `${division} — ${row.industryDescription}` : division);
    map.set(name, entry);
  }
  return [...map.entries()]
    .map(([name, e]) => ({ name, value: e.value, orders: e.orders.size, divisions: [...e.divisions].sort() }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}
