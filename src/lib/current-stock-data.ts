import sample from "./current-stock-sample.json";

export type CurrentStockRow = { plant: string; sloc: string; slocDesc: string; mtype: string; material: string; matDesc: string; uom: string; priceCtl: string; price: number; unrQ: number; unrV: number; qcQ: number; qcV: number; restrQ: number; restrV: number; blkQ: number; blkV: number; retQ: number; retV: number };

export const CURRENT_STOCK_SAMPLE = sample as CurrentStockRow[];
export const STOCK_CATEGORIES = [
  { key: "unrV", label: "Unrestricted" }, { key: "qcV", label: "In QC" }, { key: "restrV", label: "Restricted" }, { key: "blkV", label: "Blocked" }, { key: "retV", label: "Blocked Returns" },
] as const;
export const rowValue = (r: CurrentStockRow) => r.unrV + r.qcV + r.restrV + r.blkV + r.retV;
export const rowQty = (r: CurrentStockRow) => r.unrQ + r.qcQ + r.restrQ + r.blkQ + r.retQ;

export function stockTotals(rows: CurrentStockRow[]) {
  return { value: rows.reduce((a, r) => a + rowValue(r), 0), qty: rows.reduce((a, r) => a + rowQty(r), 0), unrV: rows.reduce((a, r) => a + r.unrV, 0), nonUnrV: rows.reduce((a, r) => a + r.qcV + r.restrV + r.blkV + r.retV, 0), materials: new Set(rows.map((r) => r.material)).size };
}
export function groupValue(rows: CurrentStockRow[], key: (r: CurrentStockRow) => string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + rowValue(r));
  return [...m].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
