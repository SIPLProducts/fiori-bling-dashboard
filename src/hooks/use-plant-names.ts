import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { plantShort, setPlantNames } from "@/lib/plant-names";

/** Loads the shared plant short-name lookup once; re-renders callers when it arrives. */
export function usePlantNames(): typeof plantShort {
  const { data } = useQuery({
    queryKey: ["plant-short-names"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("plant_short_names");
      if (error) throw error;
      setPlantNames(data ?? []);
      return data?.length ?? 0;
    },
  });
  void data;
  return plantShort;
}
