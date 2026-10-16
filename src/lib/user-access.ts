import { supabase } from "@/integrations/supabase/client";

export type UserAccess = { unrestricted: boolean; plants: string[]; profitCenters: string[] };

/** Mirrors public.user_can_see: both lists empty = unrestricted; otherwise plant OR profit centre must match. */
export function canSee(access: UserAccess, plant: string | null, profitCenter: string | null): boolean {
  if (access.unrestricted) return true;
  if (access.plants.length === 0 && access.profitCenters.length === 0) return true;
  return access.plants.includes(plant ?? "") || access.profitCenters.includes(profitCenter ?? "");
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

/** Ticking every master value means "no limit" for that list, so store it as empty. */
export function normalizeAccessList(selected: string[], master: string[]): string[] {
  const unique = [...new Set(selected.map((v) => v.trim()).filter(Boolean))];
  if (master.length && master.every((code) => unique.includes(code))) return [];
  return unique;
}

/** Filter dropdowns list only the values assigned to the user; an empty assignment (or admin) keeps every option. */
export function restrictToAssigned<T>(options: T[], assigned: string[] | undefined, unrestricted: boolean | undefined, valueOf: (o: T) => string): T[] {
  if (unrestricted || !assigned || assigned.length === 0) return options;
  const set = new Set(assigned);
  return options.filter((o) => set.has(valueOf(o)));
}
