import { supabase } from "@/integrations/supabase/client";
import { MONTHS, PURCHASE_TYPES, type PurchaseType } from "@/lib/purchase-register-sample";

export type PurchaseRow = {
  date: string; plant: string; plantName: string; profitCenter: string; profitCenterName: string;
  vendor: string; vendorName: string; material: string; materialName: string; group: string; type: PurchaseType; value: number;
  docNo?: string; grNo?: string;
};
type Rec = Partial<Record<"belnr" | "mblnr" | "budat" | "werks" | "name1_wer" | "prctr" | "ptext" | "lifnr" | "name1" | "matnr" | "maktx" | "ty_mat" | "ty_purch" | "shkzg" | "net_amt", string | number | null>>;
const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const CR = 1e7;

/** Amount = NET_AMT (₹, SAP net purchase value). Credit lines (SHKZG H) count negative; SAP usually already signs them. */
export function toPurchaseRow(r: Rec): PurchaseRow {
  const raw = Number(r.net_amt) || 0;
  const value = t(r.shkzg).toUpperCase() === "H" && raw > 0 ? -raw : raw;
  const tp = t(r.ty_purch).toLowerCase();
  const type: PurchaseType = tp.startsWith("imp") ? "Imported" : tp.startsWith("serv") ? "Service" : "Domestic";
  return {
    date: t(r.budat), plant: t(r.werks), plantName: t(r.name1_wer), profitCenter: t(r.prctr), profitCenterName: t(r.ptext),
    vendor: t(r.lifnr), vendorName: t(r.name1) || t(r.lifnr), material: t(r.matnr), materialName: t(r.maktx) || t(r.matnr),
    group: t(r.ty_mat) || "Others", type, value: value / CR, docNo: t(r.belnr), grNo: t(r.mblnr),
  };
}

const COLS = "id,belnr,buzei,mblnr,zeile,budat,werks,name1_wer,prctr,ptext,lifnr,name1,matnr,maktx,ty_mat,ty_purch,shkzg,net_amt";
const PAGE = 1000, CONCURRENCY = 8;

/** April–March FY window (YYYY-MM-DD). */
export const fyRange = (y: number) => ({ from: `${y}-04-01`, to: `${y + 1}-03-31` });
/** Current FY start year in IST. */
export const currentFy = (now = new Date()) => {
  const ist = new Date(now.getTime() + 330 * 60000);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth() + 1;
  return m >= 4 ? y : y - 1;
};

/** Rows for one FY only, using the budat index and parallel pages. */
export async function getPurchaseRows(fy: number): Promise<PurchaseRow[]> {
  const { from, to } = fyRange(fy);
  const head = await supabase.from("purchase_register").select("id", { count: "exact", head: true }).gte("budat", from).lte("budat", to);
  if (head.error) throw new Error(`Unable to load Purchase Register: ${head.error.message}`);
  const total = head.count ?? 0;
  const offsets: number[] = [];
  for (let o = 0; o < total; o += PAGE) offsets.push(o);
  const pages: Rec[][] = new Array(offsets.length);
  let next = 0;
  const worker = async () => {
    while (next < offsets.length) {
      const i = next++, o = offsets[i]!;
      const { data, error } = await supabase.from("purchase_register").select(COLS).gte("budat", from).lte("budat", to)
        .order("budat").order("id").range(o, o + PAGE - 1);
      if (error) throw new Error(`Unable to load Purchase Register: ${error.message}`);
      pages[i] = (data ?? []) as unknown as Rec[];
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, offsets.length) }, worker));
  return pages.flat().map(toPurchaseRow);
}

const stable = { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false } as const;

export const purchaseRegisterFyQuery = (fy: number) => ({ queryKey: ["purchase-register", "v5-fy", fy], queryFn: () => getPurchaseRows(fy), ...stable });

export const purchaseRegisterYearsQuery = {
  queryKey: ["purchase-register", "v5-years"],
  queryFn: async (): Promise<number[]> => {
    const { data, error } = await supabase.rpc("purchase_register_fiscal_years");
    if (error) throw new Error(error.message);
    const ys = ((data ?? []) as { fy_start: number }[]).map((r) => r.fy_start);
    const cur = currentFy();
    return ys.includes(cur) ? ys : [cur, ...ys].sort((a, b) => b - a);
  },
  ...stable,
};

export type PurchaseKpis = { by: { name: PurchaseType; count: number; value: number }[]; total: number; count: number };
/** Launchpad totals for the current FY, aggregated in the database (3 rows). */
export const purchaseRegisterKpiQuery = {
  queryKey: ["purchase-register", "v5-kpis"],
  queryFn: async (): Promise<PurchaseKpis> => {
    const { from, to } = fyRange(currentFy());
    const { data, error } = await supabase.rpc("purchase_register_kpis", { _from: from, _to: to });
    if (error) throw new Error(error.message);
    const by = PURCHASE_TYPES.map((t) => ({ name: t, count: 0, value: 0 }));
    for (const r of (data ?? []) as { ty_purch: string; line_count: number; total_value: number }[]) {
      const tp = String(r.ty_purch).toLowerCase();
      const k = tp.startsWith("imp") ? 1 : tp.startsWith("serv") ? 2 : 0;
      by[k]!.count += Number(r.line_count) || 0; by[k]!.value += (Number(r.total_value) || 0) / CR;
    }
    return { by, total: by.reduce((a, b) => a + b.value, 0), count: by.reduce((a, b) => a + b.count, 0) };
  },
  ...stable,
};

/** FY start year (April–March) for a YYYY-MM-DD date. */
export const fyOf = (d: string) => { const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7)); return m >= 4 ? y : y - 1; };
export const fyLabel = (y: number) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
export const monthOf = (d: string) => MONTHS[(Number(d.slice(5, 7)) + 8) % 12]!;

const r2 = (v: number) => Math.round(v * 100) / 100;

export function typeTotals(rows: PurchaseRow[]): Record<PurchaseType, number> {
  const o: Record<PurchaseType, number> = { Domestic: 0, Imported: 0, Service: 0 };
  for (const r of rows) o[r.type] += r.value;
  for (const k of PURCHASE_TYPES) o[k] = r2(o[k]);
  return o;
}

export function rankBy(rows: PurchaseRow[], key: (r: PurchaseRow) => string, label: (r: PurchaseRow) => string, limit = 10) {
  const m = new Map<string, { code: string; name: string; value: number; group: string }>();
  for (const r of rows) {
    const k = key(r); if (!k) continue;
    const e = m.get(k) ?? { code: k, name: label(r) || k, value: 0, group: r.group };
    e.value += r.value; m.set(k, e);
  }
  return [...m.values()].map((e) => ({ ...e, value: r2(e.value) })).sort((a, b) => b.value - a.value).slice(0, limit);
}

export function monthly(rows: PurchaseRow[], types: PurchaseType[]) {
  const base = MONTHS.map((m) => ({ month: m, Domestic: 0, Imported: 0, Service: 0, total: 0 }));
  for (const r of rows) { const b = base[MONTHS.indexOf(monthOf(r.date))]!; b[r.type] += r.value; }
  return base.map((b) => ({ ...b, Domestic: r2(b.Domestic), Imported: r2(b.Imported), Service: r2(b.Service), total: r2(types.reduce((s, k) => s + b[k], 0)) }));
}

export function quarters(cur: PurchaseRow[], prev: PurchaseRow[]) {
  const q = (rows: PurchaseRow[]) => { const a = [0, 0, 0, 0]; for (const r of rows) a[Math.floor(MONTHS.indexOf(monthOf(r.date)) / 3)]! += r.value; return a.map(r2); };
  const c = q(cur), p = q(prev);
  return ["Q1 Apr-Jun", "Q2 Jul-Sep", "Q3 Oct-Dec", "Q4 Jan-Mar"].map((name, i) => ({ name, current: c[i]!, previous: p[i]! }));
}
