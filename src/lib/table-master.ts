/**
 * Table Master: links a database table to the SAP API that feeds it,
 * with the sync schedule, owner and last-sync information.
 */
import { supabase } from "@/integrations/supabase/client";

export type TableMapping = {
  id: string;
  table_key: string;
  table_name: string;
  display_name: string;
  description: string | null;
  endpoint_id: string | null;
  api_name: string | null;
  schedule_expression: string;
  sync_enabled: boolean;
  owner_user_id: string | null;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_records: number;
  updated_at: string;
};

export type SyncRun = {
  id: string;
  endpoint: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  records_received: number;
  records_inserted: number;
  records_updated: number;
  error_message: string | null;
};

export const SCHEDULE_PRESETS = [
  { value: "*/5 * * * *", label: "Every 5 minutes" },
  { value: "*/10 * * * *", label: "Every 10 minutes" },
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "0 * * * *", label: "Hourly" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
  { value: "0 2 * * *", label: "Daily at 02:00" },
] as const;

export function scheduleLabel(expression: string): string {
  return SCHEDULE_PRESETS.find((p) => p.value === expression)?.label ?? expression;
}

export async function getTableMapping(tableKey: string): Promise<TableMapping | null> {
  const { data, error } = await supabase
    .from("sap_table_mappings")
    .select("*")
    .eq("table_key", tableKey)
    .maybeSingle();
  if (error) throw error;
  return (data as TableMapping | null) ?? null;
}

export async function listTableMappings(): Promise<TableMapping[]> {
  const { data, error } = await supabase
    .from("sap_table_mappings")
    .select("*")
    .order("display_name");
  if (error) throw error;
  return (data ?? []) as TableMapping[];
}

export type TableMappingInput = {
  endpoint_id: string | null;
  api_name: string | null;
  schedule_expression: string;
  sync_enabled: boolean;
  owner_user_id: string | null;
  description: string | null;
};

export async function saveTableMapping(id: string, input: TableMappingInput): Promise<void> {
  const { data: session } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("sap_table_mappings")
    .update({ ...input, updated_by: session.user?.id ?? null })
    .eq("id", id);
  if (error) throw error;
}

/** Row count of the mapped table (only tables readable by the signed-in user). */
export async function countTableRows(tableName: string): Promise<number> {
  const { count, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(tableName as any)
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function listSyncRuns(limit = 10): Promise<SyncRun[]> {
  const { data, error } = await supabase
    .from("sap_sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SyncRun[];
}

export type PortalUser = { id: string; display_name: string | null; email: string | null };

export async function listPortalUsers(): Promise<PortalUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .order("display_name");
  if (error) throw error;
  return (data ?? []) as PortalUser[];
}
