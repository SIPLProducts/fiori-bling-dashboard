import { useQuery } from "@tanstack/react-query";
import { fetchUserAccess } from "@/lib/user-access";

export function useUserAccess() {
  return useQuery({ queryKey: ["user-access"], queryFn: fetchUserAccess, staleTime: Infinity, refetchOnWindowFocus: false }).data;
}
