import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { accessForUser, listRoles } from "./access";
import { SUPER_ADMIN_ROLE_KEY } from "./screens";

export type UserStatus = "active" | "inactive";

export type PortalUser = {
  id: string;
  username: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  contact: string | null;
  employee_id: string | null;
  department: string | null;
  company: string | null;
  status: UserStatus;
  roles: string[];
};

export type UserFormInput = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  contact: string;
  status: UserStatus;
  employee_id: string;
  department: string;
  password: string;
  confirmPassword: string;
  roleKey: string;
};


async function requireSuperAdmin(): Promise<string> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("NOT_AUTHENTICATED");
  const access = await accessForUser(auth.user.id);
  if (!access.isSuperAdmin) throw new Error("Forbidden: Sharvi Admin role required");
  return auth.user.id;
}

/** Isolated auth client so creating an account never replaces the admin's session. */
function signUpClient() {
  return createClient<Database>(
    import.meta.env["VITE_SUPABASE_URL"] as string,
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

export async function listPortalUsers(): Promise<PortalUser[]> {
  await requireSuperAdmin();

  const [profilesRes, rolesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, email, first_name, last_name, display_name, contact, employee_id, department, company, status",
      )
      .order("created_at"),
    supabase.from("user_role_assignments").select("user_id, role_key"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  return (profilesRes.data ?? []).map((profile) => ({
    ...profile,
    status: (profile.status === "inactive" ? "inactive" : "active") as UserStatus,
    roles: (rolesRes.data ?? [])
      .filter((row) => row.user_id === profile.id)
      .map((row) => row.role_key),
  }));
}

function validate(input: UserFormInput, requirePassword: boolean) {
  const errors: string[] = [];
  if (!input.first_name.trim()) errors.push("First name is required");
  if (!input.last_name.trim()) errors.push("Last name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.push("A valid email is required");
  if (!input.contact.trim()) errors.push("Contact is required");
  if (!input.status) errors.push("Status is required");
  if (!input.roleKey) errors.push("A role is required");
  if (requirePassword || input.password || input.confirmPassword) {
    if (input.password.length < 8) errors.push("Password must be at least 8 characters");
    if (input.password !== input.confirmPassword) errors.push("Passwords do not match");
  }
  if (input.username && !/^[a-zA-Z0-9._-]{3,}$/.test(input.username.trim())) {
    errors.push("Username must be at least 3 characters (letters, numbers, dot, dash, underscore)");
  }
  if (errors.length) throw new Error(errors[0]!);
}

async function assertUsernameFree(username: string, ignoreUserId?: string) {
  if (!username.trim()) return;
  const query = supabase.from("profiles").select("id").ilike("username", username.trim());
  const { data, error } = await query;
  if (error) throw error;
  if ((data ?? []).some((row) => row.id !== ignoreUserId)) {
    throw new Error("That username is already taken");
  }
}

async function assertAssignableRole(roleKey: string) {
  const roles = await listRoles();
  if (!roles.some((role) => role.key === roleKey)) throw new Error(`Unknown role: ${roleKey}`);
}

export async function createPortalUser(input: { data: UserFormInput }) {
  await requireSuperAdmin();
  const form = input.data;
  validate(form, true);
  await assertUsernameFree(form.username);
  await assertAssignableRole(form.roleKey);


  const signUp = await signUpClient().auth.signUp({
    email: form.email.trim(),
    password: form.password,
    options: {
      data: {
        username: form.username.trim() || null,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        contact: form.contact.trim(),
        employee_id: form.employee_id.trim() || null,
        department: form.department.trim() || null,
        status: form.status,
      },
    },
  });
  if (signUp.error) throw signUp.error;
  const userId = signUp.data.user?.id;
  if (!userId) throw new Error("The account was created but needs email confirmation before use.");

  // Admin-created users skip the email confirmation flow — confirm immediately.
  const confirm = await supabase.rpc("admin_confirm_user_email", { _user_id: userId });
  if (confirm.error) throw confirm.error;

  const profileUpdate = await supabase
    .from("profiles")
    .update({
      username: form.username.trim() || null,
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      display_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
      contact: form.contact.trim(),
      employee_id: form.employee_id.trim() || null,
      department: form.department.trim() || null,
      status: form.status,
    })
    .eq("id", userId);
  if (profileUpdate.error) throw profileUpdate.error;

  await setRoleAssignment(userId, form.roleKey);
  return { ok: true, id: userId };
}

export async function updatePortalUser(input: {
  data: { id: string } & Omit<UserFormInput, "email">;
}) {
  await requireSuperAdmin();
  const form = input.data;
  validate({ ...form, email: "placeholder@example.com" }, false);
  await assertUsernameFree(form.username, form.id);
  await assertAssignableRole(form.roleKey);

  const { error } = await supabase
    .from("profiles")
    .update({
      username: form.username.trim() || null,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      display_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
      contact: form.contact.trim(),
      employee_id: form.employee_id.trim() || null,
      department: form.department.trim() || null,
      status: form.status,
    })
    .eq("id", form.id);
  if (error) throw error;

  await setRoleAssignment(form.id, form.roleKey);

  if (form.password) {
    const { error: pwError } = await supabase.rpc("admin_set_user_password", {
      _user_id: form.id,
      _new_password: form.password,
    });
    if (pwError) throw new Error(pwError.message);
  }

  return { ok: true };
}

export async function setUserStatus(input: { data: { id: string; status: UserStatus } }) {
  const currentUserId = await requireSuperAdmin();
  if (input.data.id === currentUserId && input.data.status === "inactive") {
    throw new Error("You cannot deactivate your own account");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ status: input.data.status })
    .eq("id", input.data.id);
  if (error) throw error;
  return { ok: true };
}

/** A user holds exactly one role; this replaces any previous assignment. */
async function setRoleAssignment(userId: string, roleKey: string) {
  const currentUserId = (await supabase.auth.getUser()).data.user?.id;
  if (userId === currentUserId && roleKey !== SUPER_ADMIN_ROLE_KEY) {
    throw new Error("You cannot remove your own Sharvi Admin role");
  }

  const del = await supabase.from("user_role_assignments").delete().eq("user_id", userId);
  if (del.error) throw del.error;
  if (!roleKey) return;

  const ins = await supabase
    .from("user_role_assignments")
    .insert({ user_id: userId, role_key: roleKey });
  if (ins.error) throw ins.error;
}


/* ---------------------------------- roles --------------------------------- */

export async function createRole(input: {
  data: { key: string; name: string; description: string };
}) {
  await requireSuperAdmin();
  const key = input.data.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (!key) throw new Error("Role key is required");
  if (!input.data.name.trim()) throw new Error("Role name is required");
  const { error } = await supabase.from("roles").insert({
    key,
    name: input.data.name.trim(),
    description: input.data.description.trim() || null,
    sort_order: 100,
  });
  if (error) throw error;
  return { ok: true, key };
}

export async function updateRole(input: {
  data: { key: string; name: string; description: string };
}) {
  await requireSuperAdmin();
  if (input.data.key === SUPER_ADMIN_ROLE_KEY) throw new Error("The Sharvi Admin role cannot be edited");
  const { error } = await supabase
    .from("roles")
    .update({ name: input.data.name.trim(), description: input.data.description.trim() || null })
    .eq("key", input.data.key);
  if (error) throw error;
  return { ok: true };
}

export async function deleteRole(input: { data: { key: string } }) {
  await requireSuperAdmin();
  if (input.data.key === SUPER_ADMIN_ROLE_KEY) throw new Error("The Sharvi Admin role cannot be deleted");
  const { error } = await supabase.from("roles").delete().eq("key", input.data.key);
  if (error) throw error;
  return { ok: true };
}

/* ------------------------------- permissions ------------------------------ */

export async function listRoleScreens(): Promise<{ role_key: string; screen_key: string }[]> {
  const { data, error } = await supabase.from("role_screens").select("role_key, screen_key");
  if (error) throw error;
  return data ?? [];
}

export async function setRoleScreen(input: {
  data: { roleKey: string; screenKey: string; enabled: boolean };
}) {
  await requireSuperAdmin();
  const { roleKey, screenKey, enabled } = input.data;
  if (roleKey === SUPER_ADMIN_ROLE_KEY) {
    throw new Error("Sharvi Admin always has access to every screen");
  }
  if (enabled) {
    const { error } = await supabase
      .from("role_screens")
      .upsert({ role_key: roleKey, screen_key: screenKey }, { onConflict: "role_key,screen_key" });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("role_screens")
      .delete()
      .eq("role_key", roleKey)
      .eq("screen_key", screenKey);
    if (error) throw error;
  }
  return { ok: true };
}
