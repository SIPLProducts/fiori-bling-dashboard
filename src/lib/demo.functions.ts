import { supabase } from "@/integrations/supabase/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./demo-config";

/**
 * Signs the shared demo account in. If the account does not exist yet (fresh
 * self-hosted database) it is created through the normal sign-up flow — the
 * database trigger provisions the profile and role.
 */
export async function ensureDemoUser() {
  const signIn = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (!signIn.error) return { email: DEMO_EMAIL, password: DEMO_PASSWORD };

  const signUp = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: {
      emailRedirectTo: `${window.location.origin}/launchpad`,
      data: { display_name: "Demo User", company: "Nexus Demo Co." },
    },
  });
  if (signUp.error) throw signUp.error;

  const retry = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (retry.error) throw retry.error;

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
}
