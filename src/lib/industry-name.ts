/** Industry Name (SAP BRTXT) totals, highest first; lines with a blank Industry Name are left out. */
export function industryTotals<T>(rows: T[], name: (r: T) => string | null | undefined, value: (r: T) => number) {
  const m = new Map<string, { name: string; value: number; count: number }>();
  for (const r of rows) {
    const k = (name(r) ?? "").trim();
    if (!k) continue;
    const cur = m.get(k) ?? { name: k, value: 0, count: 0 };
    cur.value += value(r) || 0;
    cur.count += 1;
    m.set(k, cur);
  }
  return [...m.values()].sort((a, b) => b.value - a.value);
}
