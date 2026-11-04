import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isExcludedPoType, poTypeGroup } from "@/lib/open-po-data";

export type PoRow = {
  poNo: string; item: string; poDate: string; deliveryDate: string; days: number;
  poType: string; poTypeCode: string; vendor: string; vendorName: string; purGroup: string;
  plant: string; plantName: string; material: string; materialName: string; materialGroup: string;
  qty: number; uom: string; netPrice: number; currency: string;
  /** Raw value in the line's own currency. */
  netValue: number; pendDelQty: number; pendDelValue: number; pendInvValue: number;
  /** True when the line is in INR; only INR lines count toward ₹ Cr totals. */
  inr: boolean; userName: string; deleted: boolean;
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
    poType: poTypeGroup(t(r["po_doc_type"])), poTypeCode: t(r["po_doc_type"]), vendor: v.code, vendorName: v.name || "—",
    purGroup: t(r["purchasing_group"]) || "—", plant: t(r["plant"]), plantName: t(r["plt_short"]) || t(r["plt_name"]) || t(r["plant"]),
    material: t(r["material"]), materialName: t(r["short_text"]) || t(r["material"]) || "—", materialGroup: t(r["material_group"]) || "—",
    qty: n(r["order_quantity"]), uom: t(r["order_unit"]), netPrice: n(r["net_price"]), currency: cur,
    netValue: n(r["net_order_value"]), pendDelQty: n(r["still_to_be_delivered_qty"]), pendDelValue: n(r["still_to_be_delivered_val"]),
    pendInvValue: n(r["still_to_be_invoiced_val"]), inr: cur === "INR", userName: t(r["user_name"]), deleted: !!t(r["deletion_ind"]),
  };
}

/** Delivered when nothing is still to be delivered; otherwise Overdue past the delivery date, else Pending. */
export function deliveryStatus(r: Pick<PoRow, "pendDelQty" | "deliveryDate">, today: string): DeliveryStatus {
  if (r.pendDelQty <= 0) return "Delivered";
  if (r.deliveryDate && r.deliveryDate < today) return "Overdue";
  return "Pending";
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

const PAGE = 1000, CONCURRENCY = 6;
const COLS = "id,po,po_item,po_date,delivery_date,no_of_days,po_doc_type,vendor_supplying_plant,name_of_vendor,purchasing_group,plant,plt_name,plt_short,material,short_text,material_group,order_quantity,order_unit,net_price,currency_key,net_order_value,still_to_be_delivered_qty,still_to_be_delivered_val,still_to_be_invoiced_val,user_name,deletion_ind";

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

export const purchaseOrdersQuery = queryOptions({ queryKey: ["purchase-orders", "v1"], queryFn: getPoRows, staleTime: Infinity, refetchOnWindowFocus: false });
