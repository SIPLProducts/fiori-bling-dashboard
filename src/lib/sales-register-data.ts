import { supabase } from "@/integrations/supabase/client";
import type { SalesRegisterRow } from "@/lib/sales-register";

const PAGE_SIZE = 1000;
const COLS = "vbeln,posnr,fkdat,erdat,xblnr,kunag,name_c,werks,name1_p,prctr,main_grp,sub_grp,main_group,sub_group,vtext_dc,vtweg_auft,div_name,spart,fkart,aubel,aupos,bezei_so,matnr,arktx,fkimg,netwr_tot,netwr_ex,netwr_t,kwert_cgst,kwert_sgst,kwert_igst,tcs,rfbsk,auart,vtext_sd,vtext,bstnk,mctxt,tot_ah,model,type,brtxt";
type Rec = Partial<Record<"vbeln" | "posnr" | "fkdat" | "erdat" | "xblnr" | "kunag" | "name_c" | "werks" | "name1_p" | "prctr" | "main_grp" | "sub_grp" | "main_group" | "sub_group" | "vtext_dc" | "vtweg_auft" | "div_name" | "spart" | "fkart" | "aubel" | "aupos" | "bezei_so" | "matnr" | "arktx" | "fkimg" | "netwr_tot" | "netwr_ex" | "netwr_t" | "kwert_cgst" | "kwert_sgst" | "kwert_igst" | "tcs" | "rfbsk" | "auart" | "vtext_sd" | "vtext" | "bstnk" | "mctxt" | "tot_ah" | "model" | "type" | "brtxt", string | number | null>>;
const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;

/** Net = NETWR_EX, invoice = NETWR_T (net + tax), date = FKDAT, status RFBSK "C" = Posted. */
export function toSalesRegisterRow(r: Rec): SalesRegisterRow {
  return {
    billingDate: t(r.fkdat), creationDate: t(r.erdat), billingDocument: t(r.vbeln), invoiceNo: t(r.xblnr),
    customer: t(r.kunag), customerName: t(r.name_c) || t(r.kunag),
    plant: t(r.werks), profitCenter: t(r.prctr),
    mainGroup: t(r.main_grp) || t(r.main_group), subGroup: t(r.sub_grp) || t(r.sub_group),
    productCategory: t(r.div_name), channel: t(r.vtext_dc), channelCode: t(r.auart) || t(r.vtweg_auft),
    division: t(r.spart), billingType: t(r.fkart), salesDocument: t(r.aubel), salesDocumentItem: t(r.aupos),
    salesOffice: t(r.bezei_so), materialCode: t(r.matnr), material: t(r.arktx) || t(r.matnr),
    model: t(r.model), productType: t(r.type), industry: t(r.brtxt),
    billedQty: n(r.fkimg), totalAh: n(r.tot_ah), netValue: n(r.netwr_ex), invoiceValue: n(r.netwr_t),
    cgst: n(r.kwert_cgst), sgst: n(r.kwert_sgst), igst: n(r.kwert_igst), tcs: n(r.tcs),
    descs: {
      distributionChannel: t(r.vtext_dc), division: t(r.vtext_sd) || t(r.div_name), plant: t(r.name1_p), billingType: t(r.vtext),
      billingDocument: t(r.xblnr), salesDocument: t(r.bstnk), salesDocumentItem: t(r.arktx), customer: t(r.name_c),
      material: t(r.arktx), profitCenter: t(r.mctxt), plantShort: t(r.div_name),
    },
    status: t(r.rfbsk).toUpperCase() === "C" ? "Posted" : "Pending",
  };
}

export async function getSalesRegisterRows(): Promise<SalesRegisterRow[]> {
  const out: Rec[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("sales_register").select(COLS)
      .order("vbeln", { ascending: true }).order("posnr", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Unable to load Sales Register: ${error.message}`);
    out.push(...((data ?? []) as unknown as Rec[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return out.map(toSalesRegisterRow);
}

export const salesRegisterQuery = { queryKey: ["sales-register", "v7-industry"], queryFn: getSalesRegisterRows, staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false } as const;
