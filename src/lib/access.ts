import { supabase } from "@/integrations/supabase/client";
import { SCREENS, SUPER_ADMIN_ROLE_KEY } from "./screens";

export type RoleRecord = {
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  sort_order: number;
};

export type AccessSnapshot = {
  roleKeys: string[];
  isSuperAdmin: boolean;
  screens: string[];
};

const ALL_SCREENS = SCREENS.map((screen) => screen.key);

/** Role keys + effective screen permissions for a user (union across their roles). */
export async function accessForUser(userId: string): Promise<AccessSnapshot> {
  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role_key")
    .eq("user_id", userId);

  const roleKeys = (assignments ?? []).map((row) => row.role_key);
  const isSuperAdmin = roleKeys.includes(SUPER_ADMIN_ROLE_KEY);
  if (isSuperAdmin) {
    return { roleKeys, isSuperAdmin, screens: ALL_SCREENS };
  }
  if (!roleKeys.length) return { roleKeys, isSuperAdmin: false, screens: [] };

  const { data: grants } = await supabase
    .from("role_screens")
    .select("screen_key")
    .in("role_key", roleKeys);

  const screens = Array.from(new Set((grants ?? []).map((row) => row.screen_key)));
  return { roleKeys, isSuperAdmin: false, screens };
}

export async function currentAccess(): Promise<AccessSnapshot & { userId: string }> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("NOT_AUTHENTICATED");
  const access = await accessForUser(data.user.id);
  return { ...access, userId: data.user.id };
}

export async function listRoles(): Promise<RoleRecord[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("key, name, description, is_system, sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

/** Roles a user is allowed to see/assign — Sharvi Admin is hidden from everyone else. */
export function visibleRoles(roles: RoleRecord[], isSuperAdmin: boolean): RoleRecord[] {
  return isSuperAdmin ? roles : roles.filter((role) => role.key !== SUPER_ADMIN_ROLE_KEY);
}
