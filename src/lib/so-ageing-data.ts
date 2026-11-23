import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgeRow = {
  plant: string; plantName: string; sloc: string; slocName: string; material: string; matDesc: string; uom: string; batch: string;
  doc: string; year: string; docDate: string; pc: string; q: [number, number, number, number]; v: [number, number, number, number];
  qty: number; value: number; keyDate: string; bkt: [number, number, number]; syncedAt: string;
};
type Rec = Record<string, unknown>;
const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;
export function toAgeRow(r: Rec): AgeRow {
  return {
    plant: t(r["werks"]), plantName: t(r["plant_name"]) || t(r["werks"]), sloc: t(r["lgort"]), slocName: t(r["sname"]) || t(r["lgort"]),
    material: t(r["matnr"]), matDesc: t(r["maktx"]) || t(r["matnr"]), uom: t(r["meins"]), batch: t(r["charg"]), doc: t(r["mblnr"]), year: t(r["mjahr"]),
    docDate: t(r["bldat"]), pc: t(r["prctr"]), q: [n(r["buck1"]), n(r["buck2"]), n(r["buck3"]), n(r["buck4"])], v: [n(r["valu1"]), n(r["valu2"]), n(r["valu3"]), n(r["valu4"])],
    qty: n(r["cl_stck"]), value: n(r["price"]), keyDate: t(r["key_date"]), bkt: [n(r["bkt1"]) || 90, n(r["bkt2"]) || 180, n(r["bkt3"]) || 365], syncedAt: t(r["synced_at"]),
  };
}
/** Bucket labels from the bucket days, e.g. [90,180,365] → 0–90, 91–180, 181–365, >365. */
export function bucketLabels(b: [number, number, number]): [string, string, string, string] {
  return [`0–${b[0]}`, `${b[0] + 1}–${b[1]}`, `${b[1] + 1}–${b[2]}`, `>${b[2]}`];
}
export function ageTotals(rows: AgeRow[]) {
  const q = [0, 0, 0, 0], v = [0, 0, 0, 0];
  let qty = 0, value = 0;
  for (const r of rows) { for (let i = 0; i < 4; i++) { q[i]! += r.q[i]!; v[i]! += r.v[i]!; } qty += r.qty; value += r.value; }
  return { q, v, qty, value };
}
/** Group closing value (or one bucket value) by key, descending. */
export function ageGroup(rows: AgeRow[], key: (r: AgeRow) => string, val: (r: AgeRow) => number = (r) => r.value) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r); if (!k) continue; m.set(k, (m.get(k) ?? 0) + val(r)); }
  return [...m].map(([name, value]) => ({ name, value })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}
/** Per-key value split by the four buckets, ordered by closing value. */
export function ageGroupBuckets(rows: AgeRow[], key: (r: AgeRow) => string) {
  const m = new Map<string, number[]>();
  for (const r of rows) { const k = key(r); if (!k) continue; const c = m.get(k) ?? [0, 0, 0, 0]; for (let i = 0; i < 4; i++) c[i]! += r.v[i]!; m.set(k, c); }
  return [...m].map(([name, b]) => ({ name, b1: b[0]!, b2: b[1]!, b3: b[2]!, b4: b[3]!, total: b.reduce((s, x) => s + x, 0) })).filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
}
export function ageLastSync(rows: AgeRow[]) {
  let m = "";
  for (const r of rows) if (r.syncedAt > m) m = r.syncedAt;
  return m || null;
}

const COLS = "id,werks,plant_name,lgort,sname,matnr,maktx,meins,charg,mblnr,mjahr,bldat,prctr,buck1,valu1,buck2,valu2,buck3,valu3,buck4,valu4,cl_stck,price,key_date,bkt1,bkt2,bkt3,synced_at";
const PAGE = 1000;
export async function getSoAgeing(): Promise<AgeRow[]> {
  const out: Rec[] = [];
  let after = "";
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose table access keeps the select string flexible
    let q = (supabase as unknown as { from: (t: string) => any }).from("so_ageing").select(COLS).order("id").limit(PAGE);
    if (after) q = q.gt("id", after);
    const { data, error } = await q;
    if (error) throw new Error(`Unable to load SO Ageing: ${error.message}`);
    const list = (data ?? []) as unknown as Rec[];
    out.push(...list);
    if (list.length < PAGE) break;
    after = String(list[list.length - 1]!["id"]);
  }
  return out.map(toAgeRow);
}
export const soAgeingQuery = queryOptions({ queryKey: ["so-ageing", "v1"], queryFn: getSoAgeing, staleTime: Infinity, refetchOnWindowFocus: false });
