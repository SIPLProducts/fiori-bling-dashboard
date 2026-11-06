import type { PurchaseRow } from "@/lib/purchase-register-data";

/** Material codes compared without leading zeros (SAP pads MATNR). */
export const normMat = (c: string) => String(c ?? "").trim().replace(/^0+(?=.)/, "").toUpperCase();

export type ZrmmatMaterial = { material: string; plants: string[] };

/** Pure: pick Material / Plant columns by header name and group plants per material. */
export function zrmmatMaterials(rows: Record<string, string>[]): ZrmmatMaterial[] {
  if (!rows.length) return [];
  const cols = Object.keys(rows[0] ?? {});
  const mc = cols.find((c) => /^material$/i.test(c.trim())) ?? cols.find((c) => /mat/i.test(c) && !/desc/i.test(c));
  const pc = cols.find((c) => /^(plant|plnt|werks)$/i.test(c.trim()));
  if (!mc) return [];
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    const m = normMat(r[mc] ?? "");
    if (!m) continue;
    const s = map.get(m) ?? new Set<string>();
    const p = pc ? String(r[pc] ?? "").trim() : "";
    if (p) s.add(p);
    map.set(m, s);
  }
  return [...map.entries()].map(([material, s]) => ({ material, plants: [...s] })).sort((a, b) => a.material.localeCompare(b.material, undefined, { numeric: true }));
}

/** Pure: purchase rows matching a ZRMMAT material (and its plants when listed). */
export function matchRows(rows: PurchaseRow[], m: ZrmmatMaterial): PurchaseRow[] {
  return rows.filter((r) => normMat(r.material) === m.material && (!m.plants.length || m.plants.includes(r.plant)));
}

export type MonthPoint = { month: string; qty: number; valueInr: number; price: number; mom: number | null; momPct: number | null; fromFirst: number | null; docs: number };

/** Pure: month-wise weighted price = total value ÷ total quantity; MoM vs previous purchased month. */
export function monthSeries(rows: PurchaseRow[]): MonthPoint[] {
  const g = new Map<string, { qty: number; v: number; docs: Set<string> }>();
  for (const r of rows) {
    const k = r.date.slice(0, 7);
    if (!k) continue;
    const e = g.get(k) ?? { qty: 0, v: 0, docs: new Set<string>() };
    e.qty += r.qty ?? 0; e.v += r.value * 1e7; if (r.docNo) e.docs.add(r.docNo);
    g.set(k, e);
  }
  const out: MonthPoint[] = [];
  let first: number | null = null, prev: number | null = null;
  for (const k of [...g.keys()].sort()) {
    const e = g.get(k)!;
    const price = e.qty > 0 ? e.v / e.qty : 0;
    const has = e.qty > 0;
    if (has && first == null) first = price;
    out.push({
      month: k, qty: e.qty, valueInr: e.v, price, docs: e.docs.size,
      mom: has && prev != null ? price - prev : null,
      momPct: has && prev ? ((price - prev) / prev) * 100 : null,
      fromFirst: has && first != null && out.length ? price - first : null,
    });
    if (has) prev = price;
  }
  return out;
}

export type CompareSummary = { valueInr: number; qty: number; docs: number; price: number; unit: string; latestMom: number | null; latestMomPct: number | null };

export function summarize(rows: PurchaseRow[]): CompareSummary {
  const valueInr = rows.reduce((s, r) => s + r.value * 1e7, 0);
  const qty = rows.reduce((s, r) => s + (r.qty ?? 0), 0);
  const docs = new Set(rows.map((r) => r.docNo).filter(Boolean)).size;
  const series = monthSeries(rows);
  const last = [...series].reverse().find((p) => p.mom != null);
  return { valueInr, qty, docs, price: qty > 0 ? valueInr / qty : 0, unit: rows.find((r) => r.unit)?.unit ?? "", latestMom: last?.mom ?? null, latestMomPct: last?.momPct ?? null };
}

/** Pure: drop rows whose material is in the ZKEYRM list (leading zeros ignored). */
export function excludeZkeyrm<T extends { material: string }>(rows: T[], codes: string[]): T[] {
  const set = new Set(codes.map(normMat));
  return set.size ? rows.filter((r) => !set.has(normMat(r.material))) : rows;
}
