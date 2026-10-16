import { supabase } from "@/integrations/supabase/client";

export type UserAccess = { unrestricted: boolean; plants: string[]; profitCenters: string[] };

/** Mirrors public.user_can_see: empty list = unrestricted; plant AND profit centre must both match. */
export function canSee(access: UserAccess, plant: string | null, profitCenter: string | null): boolean {
  if (access.unrestricted) return true;
  const plantOk = access.plants.length === 0 || access.plants.includes(plant ?? "");
  const pcOk = access.profitCenters.length === 0 || access.profitCenters.includes(profitCenter ?? "");
  return plantOk && pcOk;
}

/** ZTBN stores one debit/credit column pair per profit centre (e.g. coff100001_debit). */
export function isZtbnFieldAllowed(access: UserAccess, fieldName: string): boolean {
  const match = /^(.+)_(debit|credit)$/.exec(fieldName);
  if (!match || access.unrestricted || access.profitCenters.length === 0) return true;
  return access.profitCenters.some((pc) => pc.toLowerCase() === match[1]);
}

export async function fetchUserAccess(): Promise<UserAccess> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { unrestricted: false, plants: [], profitCenters: [] };
  const [admin, profile] = await Promise.all([
    supabase.rpc("is_data_admin", { _user_id: userId }),
    supabase.from("profiles").select("plants, profit_centers").eq("id", userId).maybeSingle(),
  ]);
  return {
    unrestricted: admin.data === true,
    plants: profile.data?.plants ?? [],
    profitCenters: profile.data?.profit_centers ?? [],
  };
}
