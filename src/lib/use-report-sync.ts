import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { matchesReportEndpoint, type ReportDataset } from "./report-sync-time";

export async function fetchReportSyncTime(dataset: ReportDataset): Promise<string | null> {
  const table = dataset === "net-sales" ? "zfisales_detail" : "open_sales_orders";
  const { data: mappings } = await supabase.from("sap_table_mappings")
    .select("endpoint_id").eq("table_name", table);
  const ids = (mappings ?? []).flatMap((row) => row.endpoint_id ? [row.endpoint_id] : []);
  if (ids.length) {
    const { data: endpoints, error } = await supabase.from("sap_endpoints").select("name").in("id", ids);
    if (error || !endpoints?.length) return null;
    const { data: run } = await supabase.from("sap_sync_runs").select("finished_at")
      .in("endpoint", endpoints.map((endpoint) => endpoint.name)).eq("status", "success")
      .not("finished_at", "is", null).order("finished_at", { ascending: false }).limit(1).maybeSingle();
    return run?.finished_at ?? null;
  }
  // Match legacy spaces/underscores exactly after normalization, never another dataset.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("sap_sync_runs")
      .select("endpoint,finished_at").eq("status", "success")
      .not("finished_at", "is", null).order("finished_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) return null;
    const rows = data ?? [];
    const match = rows.find((row) => matchesReportEndpoint(row.endpoint, dataset));
    if (match) return match.finished_at;
    if (rows.length < 1000) return null;
  }
}

export function useReportSync(dataset: ReportDataset) {
  return useQuery({
    queryKey: ["report-last-successful-sync", dataset],
    queryFn: () => fetchReportSyncTime(dataset),
    staleTime: Infinity, gcTime: Infinity,
    refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
}