import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import sample from "./current-stock-sample.json";

export type CurrentStockRow = {
  plant: string; sloc: string; slocDesc: string; mtype: string; material: string; matDesc: string; uom: string; batch: string;
  price: number; unrQ: number; unrV: number; qcQ: number; qcV: number; blkQ: number; blkV: number; trfQ: number; trfV: number;
  restrQ: number; restrV: number; retQ: number; retV: number; bin: string;
};

const blank = { batch: "", trfQ: 0, trfV: 0, bin: "" };
type SampleRow = Omit<CurrentStockRow, keyof typeof blank> & { priceCtl?: string };
export const CURRENT_STOCK_SAMPLE: CurrentStockRow[] = (sample as SampleRow[]).map((r) => ({ ...blank, ...r }));

export const STOCK_CATEGORIES = [
  { key: "unrV", label: "Unrestricted" }, { key: "qcV", label: "Quality Insp." }, { key: "blkV", label: "Blocked" },
  { key: "trfV", label: "In Transfer" }, { key: "restrV", label: "Restricted" }, { key: "retV", label: "Blocked Returns" },
] as const;
export const rowValue = (r: CurrentStockRow) => r.unrV + r.qcV + r.blkV + r.trfV + r.restrV + r.retV;
export const rowQty = (r: CurrentStockRow) => r.unrQ + r.qcQ + r.blkQ + r.trfQ + r.restrQ + r.retQ;
const sum = (rows: CurrentStockRow[], f: (r: CurrentStockRow) => number) => rows.reduce((a, r) => a + f(r), 0);

export function stockTotals(rows: CurrentStockRow[]) {
  return {
    value: sum(rows, rowValue), qty: sum(rows, rowQty), unrV: sum(rows, (r) => r.unrV), unrQ: sum(rows, (r) => r.unrQ),
    qcV: sum(rows, (r) => r.qcV), blkV: sum(rows, (r) => r.blkV + r.restrV + r.retV), trfV: sum(rows, (r) => r.trfV),
    nonUnrV: sum(rows, (r) => rowValue(r) - r.unrV), materials: new Set(rows.map((r) => r.material)).size,
  };
}
export function groupValue(rows: CurrentStockRow[], key: (r: CurrentStockRow) => string, val: (r: CurrentStockRow) => number = rowValue) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m].map(([name, value]) => ({ name, value })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}

const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;
type Rec = Record<string, unknown>;
export function toCurrentStockRow(r: Rec): CurrentStockRow {
  const unrQ = n(r.labst), unrV = n(r.wlabs), qcQ = n(r.insme), qcV = n(r.winsm), blkQ = n(r.speme), blkV = n(r.wspem), trfQ = n(r.trame), trfV = n(r.wtram);
  const q = unrQ + qcQ + blkQ + trfQ, v = unrV + qcV + blkV + trfV;
  return {
    plant: t(r.werks), sloc: t(r.lgort), slocDesc: t(r.lgobe), mtype: t(r.mtart) || "Not provided", material: t(r.matnr), matDesc: t(r.maktx) || t(r.matnr),
    uom: t(r.meins), batch: t(r.charg), price: q ? v / q : 0, unrQ, unrV, qcQ, qcV, blkQ, blkV, trfQ, trfV, restrQ: 0, restrV: 0, retQ: 0, retV: 0,
    bin: [t(r.rowno), t(r.shelfno), t(r.rackno), t(r.binno)].filter(Boolean).join(" / "),
  };
}

const COLS = "matnr,werks,lgort,charg,lgobe,maktx,meins,mtart,labst,wlabs,insme,winsm,speme,wspem,trame,wtram,rowno,shelfno,rackno,binno";
const PAGE = 1000;
/** Reads every visible row by keyset on id; falls back to the sample sheet only while SAP has not synced yet. */
export async function getCurrentStock(): Promise<{ rows: CurrentStockRow[]; sample: boolean }> {
  const out: Rec[] = [];
  let after = "";
  for (;;) {
    let q = supabase.from("current_stock").select(`id,${COLS}`).order("id").limit(PAGE);
    if (after) q = q.gt("id", after);
    const { data, error } = await q;
    if (error) throw new Error(`Unable to load Current Stock: ${error.message}`);
    out.push(...((data ?? []) as Rec[]));
    if (!data || data.length < PAGE) break;
    after = String((data[data.length - 1] as Rec).id);
  }
  return out.length ? { rows: out.map(toCurrentStockRow), sample: false } : { rows: CURRENT_STOCK_SAMPLE, sample: true };
}
export const currentStockQuery = queryOptions({ queryKey: ["current-stock", "v1"], queryFn: getCurrentStock, staleTime: Infinity, refetchOnWindowFocus: false });
