import { supabase } from "@/integrations/supabase/client";
import type { OpenSalesOrder } from "@/lib/open-sales-orders-data";

/** Reads every public.order_book row (paginated) and maps it to the shared order-dashboard row shape. */
type Rec = Partial<Record<"absta" | "auart" | "basic_ah" | "bezei" | "bezei_sp" | "bstdk" | "bstnk" | "created_date" | "delv_dat" | "div_name" | "gbsta" | "kunnr_bp" | "kunnr_sh" | "kunnr_sp" | "kwmeng" | "kwmeng_p" | "landx_sp" | "ld_terms" | "main_grp" | "maktx" | "matnr" | "meins" | "name1_bp" | "name1_se" | "name1_sh" | "name1_sp" | "netwr" | "pc_name" | "plant" | "plant_name" | "profit_center" | "sales_order" | "sales_order_item" | "sector" | "spart" | "sub_grp" | "tot_ah" | "tot_inr" | "vgbel" | "vkbur" | "vkgrp" | "vrkme" | "vtext_dc" | "vtweg" | "waerk", string | number | null>>;

const PAGE_SIZE = 1000;
const t = (v: unknown, fallback = "Unassigned") => (v == null ? "" : String(v)).trim() || fallback;
const n = (v: unknown) => Number(v) || 0;

function daysSince(iso: string, now: Date) {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.max(0, Math.floor((now.getTime() - ms) / 86_400_000)) : 0;
}

export function toOrderBookDashboardRow(r: Rec, now = new Date()): OpenSalesOrder {
  const quantity = n(r.kwmeng);
  const pending = n(r.kwmeng_p);
  const orderDate = t(r.created_date, "");
  return {
    order: t(r.sales_order, ""), item: t(r.sales_order_item, ""), precedingDocument: t(r.vgbel, ""),
    purchaseOrder: t(r.bstnk, ""), documentType: t(r.auart), purchaseOrderDate: t(r.bstdk, ""),
    customerSoldTo: t(r.kunnr_sp, ""), customerSoldToName: t(r.name1_sp, ""),
    customerBillTo: t(r.kunnr_bp, ""), customerBillToName: t(r.name1_bp, ""),
    customerShipTo: t(r.kunnr_sh, ""), customerShipToName: t(r.name1_sh, ""),
    customer: t(r.name1_sp, t(r.kunnr_sp)), material: t(r.matnr), description: t(r.maktx, t(r.matnr)),
    materialType: "", model: t(r.sub_grp, t(r.main_grp)), productRange: t(r.main_grp, ""), productType: t(r.sub_grp, ""),
    division: t(r.div_name, t(r.spart)), sapMainGroup: t(r.main_grp, ""), subGroup: t(r.sub_grp, ""),
    profitCentreName: t(r.pc_name, ""), quantity, openQuantity: pending || quantity,
    deliveredQuantity: pending ? Math.max(0, quantity - pending) : 0,
    ah: n(r.basic_ah), totalAh: n(r.tot_ah), unit: t(r.vrkme, t(r.meins, "")), currency: t(r.waerk, ""),
    value: n(r.netwr) / 10_000_000, ldStatus: t(r.ld_terms, ""), deliveryDate: t(r.delv_dat, ""),
    orderDate, daysOpen: daysSince(orderDate, now), salesOrg: "1000", channel: t(r.vtweg),
    plant: t(r.plant, ""), plantName: t(r.plant_name, ""), office: t(r.vkbur), salesGroup: t(r.vkgrp),
    salesRepName: t(r.name1_se, ""), zone: t(r.bezei_sp, t(r.bezei)), region: t(r.bezei_sp, ""),
    country: t(r.landx_sp, ""), salesType: t(r.vtext_dc), profitCentre: t(r.profit_center),
    mainGroup: t(r.main_grp), category: t(r.sub_grp), customerGroup: "", industryDescription: t(r.sector, ""),
    usageDescription: "", deliveryStatus: t(r.absta, ""), overallStatus: t(r.gbsta, ""),
    onTime: r.gbsta === "C",
  };
}

export async function getOrderBookRows(): Promise<OpenSalesOrder[]> {
  const out: Rec[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("order_book").select("*")
      .order("sales_order", { ascending: true }).order("sales_order_item", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Unable to load Order Book: ${error.message}`);
    out.push(...((data ?? []) as unknown as Rec[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  const now = new Date();
  return out.map((r) => toOrderBookDashboardRow(r, now));
}
