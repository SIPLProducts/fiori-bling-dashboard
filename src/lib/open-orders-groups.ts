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

export type GroupDivisionSummary = { name: string; value: number; orders: number; parts: Record<string, { value: number; orders: number }> };

/** Groups rows by key and splits each group's value/distinct orders by division (blank → "Unassigned"). */
export function summarizeGroupsByDivision<T extends GroupRow>(rows: T[], key: (row: T) => string): { groups: GroupDivisionSummary[]; divisions: string[] } {
  const map = new Map<string, { value: number; orders: Set<string>; parts: Map<string, { value: number; orders: Set<string> }> }>();
  const divTotals = new Map<string, number>();
  for (const row of rows) {
    const name = key(row).trim();
    if (!name) continue;
    const division = row.division?.trim() || "Unassigned";
    const entry = map.get(name) ?? { value: 0, orders: new Set(), parts: new Map() };
    entry.value += row.value;
    entry.orders.add(row.order);
    const part = entry.parts.get(division) ?? { value: 0, orders: new Set<string>() };
    part.value += row.value;
    part.orders.add(row.order);
    entry.parts.set(division, part);
    map.set(name, entry);
    divTotals.set(division, (divTotals.get(division) ?? 0) + row.value);
  }
  const groups = [...map.entries()].map(([name, e]) => ({
    name, value: e.value, orders: e.orders.size,
    parts: Object.fromEntries([...e.parts.entries()].map(([d, p]) => [d, { value: p.value, orders: p.orders.size }])),
  })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const divisions = [...divTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([d]) => d);
  return { groups, divisions };
}
