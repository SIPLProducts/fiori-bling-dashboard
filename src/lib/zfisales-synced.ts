import { supabase } from "@/integrations/supabase/client";
import type { SalesRow } from "./zfisales-data";

const PAGE = 1000;

/** Reads the SAP-synced ZFISALES_DETAIL table (empty array before the first sync). */
export async function fetchSyncedSalesRows(): Promise<SalesRow[]> {
  const rows: SalesRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("zfisales_detail")
      .select(
        "gl, gl_name, profit_ctr, profit_ctr_name, grp, sales_type, company_code, company_name, customer, customer_name, fiscal_year, doc_no, doc_date, posting_date, month, reference, doc_type, pk, amount, segment",
      )
      .order("posting_date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data ?? []) {
      rows.push({
        gl: r.gl ?? "",
        glName: r.gl_name ?? "",
        profitCtr: r.profit_ctr ?? "",
        profitCtrName: r.profit_ctr_name ?? "",
        group: r.grp ?? "",
        salesType: r.sales_type ?? "",
        companyCode: r.company_code ?? "",
        companyName: r.company_name ?? "",
        customer: r.customer ?? "",
        customerName: r.customer_name ?? "",
        fiscalYear: r.fiscal_year ?? "",
        docNo: r.doc_no ?? "",
        docDate: r.doc_date ?? "",
        postingDate: r.posting_date ?? "",
        month: r.month ?? "",
        reference: r.reference ?? "",
        docType: r.doc_type ?? "",
        pk: r.pk ?? "",
        amount: Number(r.amount ?? 0),
        segment: r.segment ?? "",
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return rows;
}
