export type MonthSummary = { key: string; name: string; value: number; orders: number; byDivision: Record<string, { value: number; orders: number }> };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month on Month: sums value (₹ Cr) and counts distinct orders per order-created month (and per division), oldest first. */
export function summarizeByCreatedMonth(rows: { order: string; orderDate: string; value: number; division?: string }[]): MonthSummary[] {
  const map = new Map<string, { value: number; orders: Set<string>; div: Map<string, { value: number; orders: Set<string> }> }>();
  for (const row of rows) {
    const match = /^(\d{4})-(\d{2})/.exec(row.orderDate ?? "");
    if (!match) continue;
    const key = `${match[1]}-${match[2]}`;
    const entry = map.get(key) ?? { value: 0, orders: new Set<string>(), div: new Map() };
    const v = Number.isFinite(row.value) ? row.value : 0;
    entry.value += v;
    entry.orders.add(row.order);
    const dn = row.division?.trim() || "Unassigned";
    const d = entry.div.get(dn) ?? { value: 0, orders: new Set<string>() };
    d.value += v; d.orders.add(row.order); entry.div.set(dn, d);
    map.set(key, entry);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => ({
    key,
    name: `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(2, 4)}`,
    value: entry.value,
    orders: entry.orders.size,
    byDivision: Object.fromEntries([...entry.div].map(([n, d]) => [n, { value: d.value, orders: d.orders.size }])),
  }));
}

/** Divisions across all months, largest total value first. */
export function monthDivisions(data: MonthSummary[]): string[] {
  const t = new Map<string, number>();
  for (const m of data) for (const [n, d] of Object.entries(m.byDivision)) t.set(n, (t.get(n) ?? 0) + d.value);
  return [...t].sort((a, b) => b[1] - a[1]).map(([n]) => n);
}
