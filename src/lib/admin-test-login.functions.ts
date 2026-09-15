import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { IS_STATIC_BUILD, STATIC_MIDDLEWARE_BASE } from "./sap-pull-shared";

type TestLoginToken = { tokenHash: string; email: string };

const testLoginInput = z.object({ userId: z.string().uuid() });

export const createAdminTestLoginToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => testLoginInput.parse(data))
  .handler(async ({ data, context }): Promise<TestLoginToken> => {
    if (data.userId === context.userId) throw new Error("You are already signed in as this user");

    const [
      { data: callerRoles, error: callerRoleError },
      { data: target, error: targetError },
      { data: targetRoles, error: targetRoleError },
    ] =
      await Promise.all([
        context.supabase
          .from("user_role_assignments")
          .select("role_key")
          .eq("user_id", context.userId),
        context.supabase
          .from("profiles")
          .select("id, email, status")
          .eq("id", data.userId)
          .maybeSingle(),
        context.supabase
          .from("user_role_assignments")
          .select("role_key")
          .eq("user_id", data.userId)
          .order("role_key"),
      ]);
    if (callerRoleError) throw callerRoleError;
    if (targetError) throw targetError;
    if (targetRoleError) throw targetRoleError;

    const roleKeys = (callerRoles ?? []).map((row) => row.role_key);
    const isSuperAdmin = roleKeys.includes("super_admin");
    let hasUserManagement = isSuperAdmin;
    if (!hasUserManagement && roleKeys.length) {
      const { data: grant, error: grantError } = await context.supabase
        .from("role_screens")
        .select("screen_key")
        .in("role_key", roleKeys)
        .eq("screen_key", "admin.users")
        .limit(1)
        .maybeSingle();
      if (grantError) throw grantError;
      hasUserManagement = Boolean(grant);
    }
    if (!hasUserManagement) throw new Error("Forbidden: User Management access required");

    const isAdminOnly = targetRoles?.length === 1 && targetRoles[0]?.role_key === "admin";
    if (!target || target.status !== "active" || !target.email || !isAdminOnly) {
      throw new Error("Test login is available only for active Admin users");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
    });
    if (linkError) throw new Error("Could not create the test login");

    return { tokenHash: link.properties.hashed_token, email: target.email };
  });

async function requestStaticToken(userId: string): Promise<TestLoginToken> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

  const response = await fetch(`${STATIC_MIDDLEWARE_BASE}/admin/test-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId }),
  });
  const payload = (await response.json().catch(() => ({}))) as Partial<TestLoginToken> & {
    message?: string;
  };
  if (!response.ok || !payload.tokenHash || !payload.email) {
    throw new Error(payload.message || "Could not create the test login");
  }
  return { tokenHash: payload.tokenHash, email: payload.email };
}

export async function loginAsAdminForTesting(userId: string): Promise<void> {
  const token = IS_STATIC_BUILD
    ? await requestStaticToken(userId)
    : await createAdminTestLoginToken({ data: { userId } });
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token.tokenHash,
    type: "magiclink",
  });
  if (error) throw new Error("The test login expired or could not be used");
}