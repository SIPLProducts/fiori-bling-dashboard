import { createServerFn } from "@tanstack/react-start";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./demo-config";

/** Creates (or repairs) the shared demo account so anyone can one-click sign in. */
export const ensureDemoUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);

  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Demo User", company: "Nexus Demo Co." },
    });
    if (error) throw error;
    userId = data.user?.id;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  }

  if (!userId) throw new Error("Unable to provision demo user");

  await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: userId, display_name: "Demo User", company: "Nexus Demo Co." },
      { onConflict: "id" },
    );

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
