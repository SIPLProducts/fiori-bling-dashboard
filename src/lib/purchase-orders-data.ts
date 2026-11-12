import type { PurchaseRow } from "@/lib/purchase-register-data";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isExcludedPoType, poTypeGroup } from "@/lib/open-po-data";

export type PoRow = {
  poNo: string; item: string; poDate: string; deliveryDate: string; days: number;
  poType: string; poTypeCode: string; vendor: string; vendorName: string; purGroup: string; purGroupCode: string;
  plant: string; plantName: string; material: string; materialName: string; materialGroup: string;
  qty: number; uom: string; netPrice: number; currency: string;
  /** Raw value in the line's own currency. */
  netValue: number; pendDelQty: number; pendDelValue: number; pendInvValue: number;
  /** True when the line is in INR; only INR lines count toward ₹ Cr totals. */
  inr: boolean; userName: string; deleted: boolean;
  sloc: string; mainGroup: string; sub1: string; sub2: string; division: string;
};
export const DELIVERY_STATUSES = ["Delivered", "Pending", "Overdue"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;
/** "4000068    FUTURE ELECTRONICS INC." → { code, name } */
export function splitCodeName(s: string) {
  const m = s.trim().match(/^(\S+)\s+(.+)$/);
  return m && /\d/.test(m[1]!) ? { code: m[1]!, name: m[2]!.trim() } : { code: s.trim(), name: s.trim() };
}

type Rec = Record<string, unknown>;
export function toPoRow(r: Rec): PoRow {
  const v = splitCodeName(t(r["name_of_vendor"]) || t(r["vendor_supplying_plant"]));
  const cur = t(r["currency_key"]).toUpperCase() || "INR";
  return {
    poNo: t(r["po"]), item: t(r["po_item"]), poDate: t(r["po_date"]), deliveryDate: t(r["delivery_date"]), days: n(r["no_of_days"]),
    poType: t(r["po_doc_type"]) || "—", poTypeCode: t(r["po_doc_type"]), vendor: v.code, vendorName: v.name || "—",
    purGroup: t(r["ekgrp_desc"]) || t(r["purchasing_group"]) || "—", purGroupCode: t(r["purchasing_group"]), plant: t(r["plant"]), plantName: t(r["division_name"]) || t(r["plt_short"]) || t(r["plt_name"]) || t(r["plant"]),
    material: t(r["material"]), materialName: t(r["short_text"]) || t(r["material"]) || "—", materialGroup: t(r["material_group"]) || "—",
    qty: n(r["order_quantity"]), uom: t(r["order_unit"]), netPrice: n(r["net_price"]), currency: cur,
    netValue: n(r["net_order_value"]), pendDelQty: n(r["still_to_be_delivered_qty"]), pendDelValue: n(r["still_to_be_delivered_val"]),
    pendInvValue: n(r["still_to_be_invoiced_val"]), inr: cur === "INR", userName: t(r["user_name"]), deleted: !!t(r["deletion_ind"]),
    sloc: t(r["storage_location"]), mainGroup: t(r["mngrp1"]), sub1: t(r["pcgrp1"]), sub2: t(r["pcgrp2"]), division: t(r["division_name"]),
  };
}

/** Delivered when nothing is still to be delivered; otherwise Overdue past the delivery date, else Pending. */
export function deliveryStatus(r: Pick<PoRow, "pendDelQty" | "deliveryDate">, today: string): DeliveryStatus {
  if (r.pendDelQty <= 0) return "Delivered";
  if (r.deliveryDate && r.deliveryDate < today) return "Overdue";
  return "Pending";
}

export const PO_AGING_BANDS = ["0 – 60", "61 – 180", "181 – 365", "> 365"] as const;
/** Band from SAP NO_OF_DAYS; blank/negative go to 0 – 60. */
export function poAgingBand(days: number): (typeof PO_AGING_BANDS)[number] {
  if (!(days > 60)) return "0 – 60";
  if (days <= 180) return "61 – 180";
  if (days <= 365) return "181 – 365";
  return "> 365";
}
export function poAgingData(rows: PoRow[]) {
  const m = new Map<string, number>(PO_AGING_BANDS.map((b) => [b, 0]));
  for (const r of rows) if (r.inr) m.set(poAgingBand(r.days), (m.get(poAgingBand(r.days)) ?? 0) + r.netValue);
  return PO_AGING_BANDS.map((name) => ({ name, value: m.get(name) ?? 0 })).filter((d) => d.value !== 0);
}

/** ₹ totals count INR lines only; foreign-currency lines are counted separately. */
export function poTotals(rows: PoRow[]) {
  let value = 0, pendDel = 0, pendInv = 0, foreign = 0;
  const pos = new Set<string>();
  for (const r of rows) {
    pos.add(r.poNo);
    if (!r.inr) { foreign++; continue; }
    value += r.netValue; pendDel += r.pendDelValue; pendInv += r.pendInvValue;
  }
  return { value, pendDel, pendInv, poCount: pos.size, lines: rows.length, foreignLines: foreign };
}

export function sumInr(rows: PoRow[], key: (r: PoRow) => string, val: (r: PoRow) => number = (r) => r.netValue) {
  const m = new Map<string, number>();
  for (const r of rows) if (r.inr) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export const PO_GROUPS = ["DOMESTIC", "PROJECT", "CAPITAL", "SERVICE", "IMPORTED", "OTHERS"] as const;
export const PO_GROUP_COLORS: Record<string, string> = { DOMESTIC: "#0f9d8a", PROJECT: "#1f6fd1", CAPITAL: "#8e44ad", SERVICE: "#e08a1e", IMPORTED: "#d64550", OTHERS: "#64748b" };
export const poGroup = (r: Pick<PoRow, "poTypeCode">) => poTypeGroup(r.poTypeCode);

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monLabel = (k: string) => `${MON[Number(k.slice(5, 7)) - 1]}-${k.slice(2, 4)}`;

/** Monthly INR value per PO-type group (raw ₹), sorted by month. */
export function monthlyByGroup(rows: PoRow[]) {
  const m = new Map<string, Record<string, number>>();
  for (const r of rows) {
    if (!r.inr || !r.poDate) continue;
    const k = r.poDate.slice(0, 7); const o = m.get(k) ?? {}; const g = poGroup(r);
    o[g] = (o[g] ?? 0) + r.netValue; m.set(k, o);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, o]) => ({ month: monLabel(k), total: Object.values(o).reduce((s, v) => s + v, 0), ...o }));
}

/** April–March FY ending year for an ISO date. */
export const fyOf = (d: string) => Number(d.slice(0, 4)) + (Number(d.slice(5, 7)) >= 4 ? 1 : 0);
const quarterOf = (d: string) => `Q${Math.floor(((Number(d.slice(5, 7)) + 8) % 12) / 3) + 1}`;

/** Q1–Q4 INR value for the latest FY in the data vs the FY before it. */
export function quarterlyCompare(rows: PoRow[]) {
  const dated = rows.filter((r) => r.inr && r.poDate);
  const cur = dated.reduce((mx, r) => Math.max(mx, fyOf(r.poDate)), 0);
  const q = ["Q1", "Q2", "Q3", "Q4"].map((name) => ({ name, current: 0, previous: 0 }));
  for (const r of dated) {
    const fy = fyOf(r.poDate); const row = q.find((x) => x.name === quarterOf(r.poDate))!;
    if (fy === cur) row.current += r.netValue; else if (fy === cur - 1) row.previous += r.netValue;
  }
  const c = q.reduce((s, x) => s + x.current, 0), p = q.reduce((s, x) => s + x.previous, 0);
  return { fy: cur, data: q, yoy: p ? Math.round(((c - p) / p) * 1000) / 10 : 0 };
}

const PAGE = 1000, CONCURRENCY = 6;
const COLS = "id,po,po_item,po_date,delivery_date,no_of_days,po_doc_type,vendor_supplying_plant,name_of_vendor,purchasing_group,plant,plt_name,plt_short,material,short_text,material_group,order_quantity,order_unit,net_price,currency_key,net_order_value,still_to_be_delivered_qty,still_to_be_delivered_val,still_to_be_invoiced_val,user_name,deletion_ind,storage_location,mngrp1,pcgrp1,pcgrp2,division_name,ekgrp_desc";

export async function getPoRows(): Promise<PoRow[]> {
  const head = await supabase.from("purchase_orders").select("id", { count: "exact", head: true });
  if (head.error) throw new Error(`Unable to load Purchase Orders: ${head.error.message}`);
  const offsets: number[] = [];
  for (let o = 0; o < (head.count ?? 0); o += PAGE) offsets.push(o);
  const pages: Rec[][] = new Array(offsets.length);
  let next = 0;
  const worker = async () => {
    while (next < offsets.length) {
      const i = next++, o = offsets[i]!;
      const { data, error } = await supabase.from("purchase_orders").select(COLS).order("id").range(o, o + PAGE - 1);
      if (error) throw new Error(`Unable to load Purchase Orders: ${error.message}`);
      pages[i] = (data ?? []) as unknown as Rec[];
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, offsets.length) }, worker));
  return pages.flat().map(toPoRow).filter((r) => !r.deleted && !isExcludedPoType(r.poTypeCode));
}

export const purchaseOrdersQuery = queryOptions({ queryKey: ["purchase-orders", "v3-ekgrp-desc"], queryFn: getPoRows, staleTime: Infinity, refetchOnWindowFocus: false });

/** DOMESTIC document-type value and the remaining value (INR lines only, raw ₹). */
export function domesticSplit(rows: PoRow[]) {
  let total = 0, domestic = 0;
  for (const r of rows) if (r.inr) { total += r.netValue; if (poGroup(r) === "DOMESTIC") domestic += r.netValue; }
  return { total, domestic, remaining: total - domestic };
}

/** Adapt INR PO lines to the Purchase Register row shape used by the ZKEYRM Comparison card (value in ₹ Cr). */
export function poToPurchaseRows(rows: PoRow[]): PurchaseRow[] {
  return rows.filter((r) => r.inr).map((r) => ({
    date: r.poDate, plant: r.plant, plantName: r.division || r.plantName, plantSh: r.division || r.plantName, profitCenter: "", profitCenterName: "",
    vendor: r.vendor, vendorName: r.vendorName, material: r.material, materialName: r.materialName, group: r.materialGroup, type: "Domestic",
    value: r.netValue / 1e7, docNo: r.poNo, grNo: r.item, qty: r.qty, unit: r.uom, rate: r.netPrice,
  }));
}
