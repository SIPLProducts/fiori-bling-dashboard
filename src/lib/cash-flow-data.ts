import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapZcashRow, type CashTransaction, type ZcashFlowDbRow } from "@/lib/cash-flow";

const COLUMNS = "id,plant,profit_center,profit_center_name,gl_code,gl_name,profit_center_group,classification,nature,debit,credit,net,collection_disbursement,synced_at";

/** Reads every ZCASH_FLOW row in pages; cached until the user clicks Refresh. */
export const cashFlowQueryOptions = () =>
  queryOptions({
    queryKey: ["zcash-flow", "v1"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: Infinity,
    queryFn: async (): Promise<{ rows: CashTransaction[]; syncedAt: string | null }> => {
      const rows: CashTransaction[] = [];
      let syncedAt: string | null = null;
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("zcash_flow").select(COLUMNS).order("id").range(from, from + 999);
        if (error) throw error;
        for (const r of data ?? []) {
          rows.push(mapZcashRow(r as unknown as ZcashFlowDbRow));
          const s = (r as { synced_at: string }).synced_at;
          if (s && (!syncedAt || s > syncedAt)) syncedAt = s;
        }
        if (!data || data.length < 1000) break;
      }
      return { rows, syncedAt };
    },
  });
