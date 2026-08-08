import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "./sap.functions";

export type PortalUser = {
  id: string;
  display_name: string | null;
  company: string | null;
  roles: AppRole[];
};

export const listPortalUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalUser[]> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

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
      roles: (rolesRes.data ?? [])
        .filter((r) => r.user_id === profile.id)
        .map((r) => r.role as AppRole),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: AppRole; enabled: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    if (data.enabled) {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      if (data.userId === userId && data.role === "admin") {
        throw new Error("You cannot remove your own admin role");
      }
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw error;
    }
    return { ok: true };
  });
