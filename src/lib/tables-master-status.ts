import { supabase } from "@/integrations/supabase/client";
import { MONTHS } from "@/lib/month-wise-upload";

export const SCREEN_CATEGORY: Record<string, string> = {
  "tables.sap-master": "sap_master",
  "tables.zrmmat": "zrmmat",
  "tables.zpc-group": "zpc_group",
  "tables.valuation-subgroup": "valuation_subgroup",
};
export type TableStatus = { value: string; note: string };
const ist = (s: string) => new Date(s).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Pure: summarise master sheets of one category for a launchpad tile. */
export function summarizeMasters(rows: { category: string; row_count: number | null; updated_at: string | null }[], category: string): TableStatus {
  const own = rows.filter((r) => r.category === category);
  if (!own.length) return { value: "No data uploaded", note: "Tables Master" };
  const total = own.reduce((s, r) => s + (r.row_count ?? 0), 0);
  const last = own.reduce<string | null>((m, r) => r.updated_at && (!m || r.updated_at > m) ? r.updated_at : m, null);
  return { value: `${total.toLocaleString("en-IN")} rows`, note: `${own.length} sheet${own.length === 1 ? "" : "s"} · Last updated ${last ? ist(last) : "—"} IST` };
}

export const tablesMasterStatusQuery = {
  queryKey: ["tables-master-status"] as const,
  queryFn: async (): Promise<Record<string, TableStatus>> => {
    const out: Record<string, TableStatus> = {};
    const m = await supabase.from("sap_masters").select("category,row_count,updated_at");
    const rows = (m.data ?? []) as { category: string; row_count: number | null; updated_at: string | null }[];
    for (const [screen, cat] of Object.entries(SCREEN_CATEGORY)) out[screen] = summarizeMasters(rows, cat);
    const latest = await supabase.from("month_wise_upload").select("year,month").order("year", { ascending: false }).order("month", { ascending: false }).limit(1).maybeSingle();
    if (latest.data) {
      const { year, month } = latest.data;
      const [cnt, upd] = await Promise.all([
        supabase.from("month_wise_upload").select("id", { count: "exact", head: true }).eq("year", year).eq("month", month),
        supabase.from("month_wise_upload").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      out["tables.month-wise-upload"] = { value: `${MONTHS[month - 1]!.slice(0, 3)} ${year}`, note: `${(cnt.count ?? 0).toLocaleString("en-IN")} rows · Last updated ${upd.data ? ist(upd.data.updated_at) : "—"} IST` };
    } else out["tables.month-wise-upload"] = { value: "No data uploaded", note: "Tables Master" };
    return out;
  },
};
