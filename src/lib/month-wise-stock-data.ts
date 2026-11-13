import { supabase } from "@/integrations/supabase/client";
import { getMasterRows, mastersQuery } from "@/lib/sap-master";
import { mapStockRows, valuationLookup, zpcLookup, type StockRow } from "@/lib/month-wise-stock-map";

async function masterRows(cat: "zpc_group" | "valuation_subgroup") {
  const ms = await mastersQuery(cat).queryFn();
  return (await Promise.all(ms.map((m) => getMasterRows(m.id)))).flat();
}

export const monthWiseStockQuery = {
  queryKey: ["month-wise-stock", "v1"] as const,
  queryFn: async (): Promise<StockRow[]> => {
    const raw: { id: string; month: number; year: number; data: Record<string, string> }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("month_wise_upload").select("id,month,year,data").order("year").order("month").order("id").range(from, from + 999);
      if (error) throw error;
      raw.push(...((data ?? []) as unknown as typeof raw));
      if (!data || data.length < 1000) break;
    }
    const [zpc, val] = await Promise.all([masterRows("zpc_group"), masterRows("valuation_subgroup")]);
    return mapStockRows(raw, valuationLookup(val), zpcLookup(zpc));
  },
  staleTime: Infinity, refetchOnWindowFocus: false,
};
