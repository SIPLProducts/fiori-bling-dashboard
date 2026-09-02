import { supabase } from "@/integrations/supabase/client";
import { canAccessModule } from "./sap-modules";
import { accessForUser } from "./access";
import { buildSalesAnalytics } from "./zfisales";
import type { SalesRow } from "./zfisales-data";
import type { SalesFilters, SalesAnalytics } from "./zfisales-types";
import { fetchSyncedSalesRows } from "./zfisales-synced";

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


export async function getSalesAnalytics(input?: {
  data?: Partial<SalesFilters>;
}): Promise<SalesAnalytics> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("NOT_AUTHENTICATED");

  const { screens } = await accessForUser(auth.user.id);
  if (!canAccessModule("sd", screens)) throw new Error("FORBIDDEN_MODULE");

  let synced: SalesRow[] = [];
  try {
    synced = await fetchSyncedSalesRows();
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
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // newest row actually stored in the detail table (covers bulk loads with no run row)
  const { data: newest } = await supabase
    .from("zfisales_detail")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const runAt = run?.finished_at ?? run?.started_at ?? null;
  const dataAt = newest?.synced_at ?? null;
  const lastSyncedAt =
    runAt && dataAt ? (new Date(runAt) > new Date(dataAt) ? runAt : dataAt) : (runAt ?? dataAt);

  const rowCount = count ?? 0;
  return {
    source: rowCount > 0 ? "ZFISALES_DETAIL" : "SAMPLE",
    rowCount,
    lastSyncedAt,
    lastStatus: run?.status ?? null,
  };
}
