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

/** Segment totals grouped by code (BRSCH), labelled by the most common name (BRTXT) for that code, else the code. Blank codes are left out. */
export function segmentTotals<T>(rows: T[], code: (r: T) => string | null | undefined, name: (r: T) => string | null | undefined, value: (r: T) => number) {
  const m = new Map<string, { value: number; count: number; names: Map<string, number> }>();
  for (const r of rows) {
    const c = (code(r) ?? "").trim();
    if (!c) continue;
    const cur = m.get(c) ?? { value: 0, count: 0, names: new Map<string, number>() };
    cur.value += value(r) || 0; cur.count += 1;
    const nm = (name(r) ?? "").trim();
    if (nm) cur.names.set(nm, (cur.names.get(nm) ?? 0) + 1);
    m.set(c, cur);
  }
  return [...m.entries()].map(([c, v]) => {
    const best = [...v.names.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    return { code: c, name: best ? best[0] : c, value: v.value, count: v.count };
  }).sort((a, b) => b.value - a.value);
}

/** Map of segment code → display name, using the same rule as segmentTotals. */
export function segmentNameMap<T>(rows: T[], code: (r: T) => string | null | undefined, name: (r: T) => string | null | undefined) {
  return new Map(segmentTotals(rows, code, name, () => 0).map((s) => [s.code, s.name]));
}
