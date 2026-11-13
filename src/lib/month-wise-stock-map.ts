import type { PurchaseRow } from "@/lib/purchase-register-data";

export type StockRow = {
  key: string; month: number; year: number; period: string; plant: string; location: string; material: string; materialName: string;
  profitCenter: string; valClass: string; type: string; matGroup: string; unit: string; qty: number; value: number;
  mainGroup: string; sub1: string; sub2: string; sub3: string; data: Record<string, string>;
};

const t = (v: unknown) => (v == null ? "" : String(v)).trim();
/** Numbers from Excel text: drop thousands separators; blank → 0. */
export const num = (v: unknown) => { const n = Number(t(v).replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
const pick = (d: Record<string, string>, name: string) => {
  if (name in d) return d[name];
  const k = Object.keys(d).find((x) => x.trim().toLowerCase() === name.toLowerCase());
  return k ? d[k] : "";
};
const strip0 = (c: string) => c.replace(/^0+(?=.)/, "").toUpperCase();

/** Pure: valuation class → Short Name (else Description). */
export function valuationLookup(rows: Record<string, string>[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) { const c = t(pick(r, "Valuation Class")); if (c) m.set(strip0(c), t(pick(r, "Short Name")) || t(pick(r, "Description"))); }
  return m;
}
/** Pure: profit centre → main/sub groups from ZPC GROUP. */
export function zpcLookup(rows: Record<string, string>[]): Map<string, [string, string, string, string]> {
  const m = new Map<string, [string, string, string, string]>();
  for (const r of rows) { const c = t(pick(r, "PRCTR")); if (c) m.set(strip0(c), [t(pick(r, "MNGRP1")), t(pick(r, "PCGRP1")), t(pick(r, "PCGRP2")), t(pick(r, "PCGRP3"))]); }
  return m;
}

export function mapStockRows(raw: { id: string; month: number; year: number; data: Record<string, string> }[], val: Map<string, string>, zpc: Map<string, [string, string, string, string]>): StockRow[] {
  return raw.map((r) => {
    const d = r.data; const vc = t(pick(d, "ValCl")); const pc = t(pick(d, "Profit Centre"));
    const g = zpc.get(strip0(pc)) ?? ["", "", "", ""];
    return {
      key: r.id, month: r.month, year: r.year, period: `${r.year}-${String(r.month).padStart(2, "0")}`,
      plant: t(pick(d, "Plnt")), location: t(pick(d, "Location")), material: t(pick(d, "Material")), materialName: t(pick(d, "Material Description")),
      profitCenter: pc, valClass: vc, type: val.get(strip0(vc)) || vc || "Unassigned", matGroup: t(pick(d, "Matl Group")), unit: t(pick(d, "BUn")),
      qty: num(pick(d, "CB Qty")), value: num(pick(d, "CB Val")), mainGroup: g[0], sub1: g[1], sub2: g[2], sub3: g[3], data: d,
    };
  });
}

/** Pure: sum value by a key, descending, empty keys ignored. */
export function sumBy(rows: StockRow[], k: (r: StockRow) => string) {
  const m = new Map<string, number>();
  for (const r of rows) { const n = k(r); if (n) m.set(n, (m.get(n) ?? 0) + r.value); }
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/** Adapt to the ZKEYRM card (value in ₹ Cr, date = 1st of month). */
export const toPurchaseRows = (rows: StockRow[]): PurchaseRow[] => rows.map((r) => ({
  date: `${r.period}-01`, plant: r.plant, plantName: r.plant, profitCenter: r.profitCenter, profitCenterName: "", vendor: "", vendorName: "",
  material: r.material, materialName: r.materialName, group: r.matGroup, type: "Domestic" as PurchaseRow["type"], value: r.value / 1e7, qty: r.qty, unit: r.unit, docNo: r.period,
}));

/** Top-N list plus the remaining entries (already sorted by value desc). */
export function topWithOthers<T extends { name: string; value: number }>(list: T[], n = 10) {
  const sorted = [...list].sort((a, b) => b.value - a.value);
  return { top: sorted.slice(0, n), others: sorted.slice(n) };
}
