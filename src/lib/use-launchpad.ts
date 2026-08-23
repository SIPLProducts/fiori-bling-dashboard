import { useQuery } from "@tanstack/react-query";
import { getLaunchpad } from "@/lib/sap.functions";

/** Shared launchpad query — powers role-aware navigation on every screen. */
export function useLaunchpad() {
  const fetchLaunchpad = getLaunchpad;
  return useQuery({
    queryKey: ["launchpad"],
    queryFn: () => fetchLaunchpad(),
    staleTime: 60_000,
  });
}
