import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./sap.functions";

export type PortalUser = {
  id: string;
  display_name: string | null;
  company: string | null;
  roles: AppRole[];
};

async function requireAdmin(): Promise<string> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("NOT_AUTHENTICATED");
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
  return auth.user.id;
}

export async function listPortalUsers(): Promise<PortalUser[]> {
  await requireAdmin();

  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, company").order("created_at"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  return (profilesRes.data ?? []).map((profile) => ({
    id: profile.id,
    display_name: profile.display_name,
    company: profile.company,
    roles: (rolesRes.data ?? []).filter((r) => r.user_id === profile.id).map((r) => r.role as AppRole),
  }));
}

export async function setUserRole(input: {
  data: { userId: string; role: AppRole; enabled: boolean };
}) {
  const currentUserId = await requireAdmin();
  const { userId, role, enabled } = input.data;

  if (enabled) {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    if (error) throw error;
  } else {
    if (userId === currentUserId && role === "admin") {
      throw new Error("You cannot remove your own admin role");
    }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) throw error;
  }
  return { ok: true };
}
