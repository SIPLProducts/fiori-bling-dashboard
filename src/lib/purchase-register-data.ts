import { supabase } from "@/integrations/supabase/client";
import { MONTHS, PURCHASE_TYPES, type PurchaseType } from "@/lib/purchase-register-sample";

export type PurchaseRow = {
  date: string; plant: string; plantName: string; profitCenter: string; profitCenterName: string;
  vendor: string; vendorName: string; material: string; materialName: string; group: string; type: PurchaseType; value: number;
  docNo?: string; grNo?: string;
};
type Rec = Partial<Record<"belnr" | "mblnr" | "budat" | "werks" | "name1_wer" | "prctr" | "ptext" | "lifnr" | "name1" | "matnr" | "maktx" | "ty_mat" | "ty_purch" | "shkzg" | "total", string | number | null>>;
const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const CR = 1e7;

/** Amount = TOTAL (₹, SAP purchase value). Credit lines (SHKZG H) count negative; SAP usually already signs them. */
export function toPurchaseRow(r: Rec): PurchaseRow {
  const raw = Number(r.total) || 0;
  const value = t(r.shkzg).toUpperCase() === "H" && raw > 0 ? -raw : raw;
  const tp = t(r.ty_purch).toLowerCase();
  const type: PurchaseType = tp.startsWith("imp") ? "Imported" : tp.startsWith("serv") ? "Service" : "Domestic";
  return {
    date: t(r.budat), plant: t(r.werks), plantName: t(r.name1_wer), profitCenter: t(r.prctr), profitCenterName: t(r.ptext),
    vendor: t(r.lifnr), vendorName: t(r.name1) || t(r.lifnr), material: t(r.matnr), materialName: t(r.maktx) || t(r.matnr),
    group: t(r.ty_mat) || "Others", type, value: value / CR, docNo: t(r.belnr), grNo: t(r.mblnr),
  };
}

export async function getPurchaseRows(): Promise<PurchaseRow[]> {
  const out: Rec[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("purchase_register")
      .select("belnr,buzei,mblnr,zeile,budat,werks,name1_wer,prctr,ptext,lifnr,name1,matnr,maktx,ty_mat,ty_purch,shkzg,total")
      .order("belnr").order("buzei").order("mblnr").order("zeile").range(from, from + 999);
    if (error) throw new Error(`Unable to load Purchase Register: ${error.message}`);
    out.push(...((data ?? []) as unknown as Rec[]));
    if (!data || data.length < 1000) break;
  }
  return out.map(toPurchaseRow);
}

export const purchaseRegisterQuery = { queryKey: ["purchase-register", "v3-docs"], queryFn: getPurchaseRows, staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false } as const;

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
