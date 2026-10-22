import { supabase } from "@/integrations/supabase/client";
import type { OpenSalesOrder } from "@/lib/open-sales-orders-data";

/** Reads every public.sales_in_transit row (paginated) and maps it to the shared order-dashboard row shape. */
type Rec = Partial<Record<"arktx" | "auart" | "aubel" | "basic_ah" | "bezei_c" | "bezei_sg" | "bezei_so" | "brtxt" | "bstdk" | "bstnk" | "bukrs" | "div_name" | "division" | "erdat" | "fkart" | "fkdat" | "fkimg" | "kunag" | "kunnr_re" | "kunnr_s" | "landx50_c" | "lfdat_del" | "main_grp" | "matnr" | "mctxt" | "meins" | "message" | "mtart" | "name1_p" | "name_c" | "name_re" | "name_s" | "name_se" | "netwr_tot" | "posnr" | "prctr" | "rfbsk" | "spart" | "sub_grp" | "tot_ah" | "vbeln" | "vrkme" | "vtext" | "vtext_dc" | "vtweg_auft" | "waerk" | "werks", string | number | null>>;

const PAGE_SIZE = 1000;
const t = (v: unknown, fallback = "Unassigned") => (v == null ? "" : String(v)).trim() || fallback;
const n = (v: unknown) => Number(v) || 0;

function daysSince(iso: string, now: Date) {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.max(0, Math.floor((now.getTime() - ms) / 86_400_000)) : 0;
}

/** SIT value = NETWR_TOT (₹) shown in ₹ Cr; date = ERDAT (FKDAT fallback); zone = BEZEI_SO; region = BEZEI_C. */
export function toSitDashboardRow(r: Rec, now = new Date()): OpenSalesOrder {
  const quantity = n(r.fkimg);
  const orderDate = t(r.erdat, t(r.fkdat, ""));
  return {
    order: t(r.vbeln, ""), item: t(r.posnr, ""), precedingDocument: t(r.aubel, ""),
    purchaseOrder: t(r.bstnk, ""), documentType: t(r.auart, t(r.fkart)), purchaseOrderDate: t(r.bstdk, ""),
    customerSoldTo: t(r.kunag, ""), customerSoldToName: t(r.name_c, ""),
    customerBillTo: t(r.kunnr_re, ""), customerBillToName: t(r.name_re, ""),
    customerShipTo: t(r.kunnr_s, ""), customerShipToName: t(r.name_s, ""),
    customer: t(r.name_c, t(r.kunag)), material: t(r.matnr), description: t(r.arktx, t(r.matnr)),
    materialType: t(r.mtart, ""), model: "", productRange: "", productType: "",
    division: t(r.div_name, t(r.division, t(r.spart))), sapMainGroup: t(r.main_grp, ""), subGroup: t(r.sub_grp, ""),
    profitCentreName: t(r.mctxt, ""), quantity, openQuantity: quantity, deliveredQuantity: 0,
    ah: n(r.basic_ah), totalAh: n(r.tot_ah), unit: t(r.vrkme, t(r.meins, "")), currency: t(r.waerk, ""),
    value: n(r.netwr_tot) / 10_000_000, ldStatus: "", deliveryDate: t(r.lfdat_del, ""),
    orderDate, daysOpen: daysSince(orderDate, now), salesOrg: t(r.bukrs, "1000"), channel: t(r.vtweg_auft),
    plant: t(r.werks, ""), plantName: t(r.name1_p, ""), office: t(r.bezei_so), salesGroup: t(r.bezei_sg),
    salesRepName: t(r.name_se, ""), zone: t(r.bezei_so, "Unassigned"), region: t(r.bezei_c, ""),
    country: t(r.landx50_c, ""), salesType: t(r.vtext_dc), profitCentre: t(r.prctr),
    mainGroup: t(r.main_grp), category: t(r.sub_grp), customerGroup: "", industryDescription: t(r.brtxt, ""),
    usageDescription: "", deliveryStatus: "", overallStatus: t(r.rfbsk, ""), onTime: false,
  };
}

export async function getSitRows(): Promise<OpenSalesOrder[]> {
  const out: Rec[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("sales_in_transit").select("*")
      .order("vbeln", { ascending: true }).order("posnr", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Unable to load Sales In Transit: ${error.message}`);
    out.push(...((data ?? []) as unknown as Rec[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  const now = new Date();
  return out.map((r) => toSitDashboardRow(r, now));
}
