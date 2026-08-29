import { supabase } from "@/integrations/supabase/client";
import { canAccessModule } from "./sap-modules";
import { accessForUser } from "./access";
import { buildSalesAnalytics } from "./zfisales";
import type { SalesRow } from "./zfisales-data";
import type { SalesFilters, SalesAnalytics } from "./zfisales-types";

const emptyFilters: SalesFilters = {
  fiscalYear: "",
  companyCodes: [],
  profitCentres: [],
  salesTypes: [],
  segments: [],
  postingFrom: "",
  postingTo: "",
  search: "",
  seriesBy: "none",
};

const PAGE = 1000;

/** Reads the SAP-synced ZFISALES_DETAIL table (empty array before the first sync). */
async function fetchSyncedRows(): Promise<SalesRow[]> {
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

export async function getSalesAnalytics(input?: {
  data?: Partial<SalesFilters>;
}): Promise<SalesAnalytics> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("NOT_AUTHENTICATED");

  const { screens } = await accessForUser(auth.user.id);
  if (!canAccessModule("sd", screens)) throw new Error("FORBIDDEN_MODULE");

  let synced: SalesRow[] = [];
  try {
    synced = await fetchSyncedRows();
  } catch {
    synced = [];
  }

  return buildSalesAnalytics({ ...emptyFilters, ...(input?.data ?? {}) }, synced);
}

export type SalesSyncStatus = {
  source: "ZFISALES_DETAIL" | "SAMPLE";
  rowCount: number;
  lastSyncedAt: string | null;
  lastStatus: string | null;
};

export async function getSalesSyncStatus(): Promise<SalesSyncStatus> {
  const { count } = await supabase
    .from("zfisales_detail")
    .select("id", { count: "exact", head: true });

  const { data: run } = await supabase
    .from("sap_sync_runs")
    .select("status, finished_at, started_at")
    .eq("endpoint", "ZFISALES")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rowCount = count ?? 0;
  return {
    source: rowCount > 0 ? "ZFISALES_DETAIL" : "SAMPLE",
    rowCount,
    lastSyncedAt: run?.finished_at ?? run?.started_at ?? null,
    lastStatus: run?.status ?? null,
  };
}
