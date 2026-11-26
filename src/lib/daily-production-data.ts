import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DprRow = {
  plant: string; plantName: string; stage: string; mvt: string; material: string; matDesc: string; sloc: string; batch: string; qty: number; uom: string;
  order: string; date: string; value: number; rate: number; wc: string; wcDesc: string; cc: string; ccName: string;
  doc: string; scrapQty: number; scrapVal: number; user: string; syncedAt: string;
};

const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;
type Rec = Record<string, unknown>;
export function toDprRow(r: Rec): DprRow {
  return {
    plant: t(r["werks"]), plantName: t(r["plant_short_name"]) || t(r["werks"]), stage: t(r["zstage"]), mvt: t(r["bwart"]), material: t(r["matnr"]), matDesc: t(r["maktx"]) || t(r["matnr"]),
    sloc: t(r["lgort"]), batch: t(r["charg"]), qty: n(r["menge"]), uom: t(r["meins"]), order: t(r["aufnr"]), date: t(r["budat"]),
    value: n(r["dmbtr"]), rate: n(r["rate"]), wc: t(r["arbpl"]), wcDesc: t(r["ktext_up"]) || t(r["arbpl"]), cc: t(r["zkostl"]),
    ccName: t(r["zkostl_name"]) || t(r["zkostl"]), doc: t(r["mblnr"]), scrapQty: n(r["scrap_qty"]), scrapVal: n(r["scrap_value"]), user: t(r["uname"]) || t(r["usnam"]), syncedAt: t(r["synced_at"]),
  };
}

/** Totals for tiles; scrap % = scrap qty ÷ (good + scrap qty). */
export function dprTotals(rows: DprRow[]) {
  let qty = 0, value = 0, scrapQty = 0, scrapVal = 0;
  for (const r of rows) { qty += r.qty; value += r.value; scrapQty += r.scrapQty; scrapVal += r.scrapVal; }
  return { qty, value, scrapQty, scrapVal, net: value - scrapVal, scrapPct: qty + scrapQty ? (scrapQty / (qty + scrapQty)) * 100 : 0, orders: new Set(rows.map((r) => r.order).filter(Boolean)).size };
}
export function dprGroup(rows: DprRow[], key: (r: DprRow) => string, val: (r: DprRow) => number = (r) => r.value) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r); if (!k) continue; m.set(k, (m.get(k) ?? 0) + val(r)); }
  return [...m].map(([name, value]) => ({ name, value })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}
/** Launchpad/screen summary for rows inside [from, to] (ISO dates), plus latest sync time. */
export function dprPeriodSummary(rows: DprRow[], from: string, to: string) {
  const inRange = rows.filter((r) => r.date && r.date >= from && r.date <= to);
  const t = dprTotals(inRange);
  return { production: t.value, scrap: t.scrapVal, count: inRange.length, syncedAt: dprLastSync(rows) };
}
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
/** Latest posting month with data (same month the screen opens on). */
export function dprLatestMonthSummary(rows: DprRow[]) {
  const latest = rows.reduce((m, r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date > m ? r.date : m, "");
  if (!latest) return null;
  const t = dprTotals(rows.filter((r) => r.date.slice(0, 7) === latest.slice(0, 7)));
  return { month: `${MON[Number(latest.slice(5, 7)) - 1]} ${latest.slice(0, 4)}`, orders: t.orders, production: t.value, scrap: t.scrapVal, net: t.net, syncedAt: dprLastSync(rows) };
}
export function dprLastSync(rows: DprRow[]) {
  let m = "";
  for (const r of rows) if (r.syncedAt > m) m = r.syncedAt;
  return m || null;
}
/** Day-wise production and scrap value, oldest first. */
export function dprDaily(rows: DprRow[]) {
  const m = new Map<string, { value: number; scrap: number }>();
  for (const r of rows) { if (!r.date) continue; const c = m.get(r.date) ?? { value: 0, scrap: 0 }; c.value += r.value; c.scrap += r.scrapVal; m.set(r.date, c); }
  return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}

const COLS = "id,werks,plant_short_name,zstage,bwart,matnr,maktx,lgort,charg,menge,meins,aufnr,budat,dmbtr,rate,arbpl,ktext_up,zkostl,zkostl_name,mblnr,scrap_qty,scrap_value,uname,usnam,synced_at";
const PAGE = 1000;
export async function getDailyProduction(): Promise<DprRow[]> {
  const out: Rec[] = [];
  let after = "";
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table added after generated types
    let q = (supabase as unknown as { from: (t: string) => any }).from("daily_production").select(COLS).order("id").limit(PAGE);
    if (after) q = q.gt("id", after);
    const { data, error } = await q;
    if (error) throw new Error(`Unable to load Daily Production: ${error.message}`);
    const list = (data ?? []) as unknown as Rec[];
    out.push(...list);
    if (list.length < PAGE) break;
    after = String(list[list.length - 1]!["id"]);
  }
  return out.map(toDprRow);
}
export const dailyProductionQuery = queryOptions({ queryKey: ["daily-production", "v3"], queryFn: getDailyProduction, staleTime: Infinity, refetchOnWindowFocus: false });
/** Every non-Sunday date from first to last posting date, with summed production value (0 = no production). */
export function dprDailyChart(rows: DprRow[]) {
  const m = new Map<string, number>();
  for (const r of rows) if (/^\d{4}-\d{2}-\d{2}$/.test(r.date)) m.set(r.date, (m.get(r.date) ?? 0) + r.value);
  const keys = [...m.keys()].sort();
  if (!keys.length) return [];
  const out: { date: string; value: number }[] = [];
  const end = new Date(`${keys[keys.length - 1]}T00:00:00Z`);
  for (const d = new Date(`${keys[0]}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) continue;
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso, value: m.get(iso) ?? 0 });
  }
  return out;
}
/** A day showing 0.00 Cr (under ₹50,000) counts as no production on the day-wise chart. */
export function isNoProductionDay(value: number) {
  return value / 1e7 < 0.005;
}
