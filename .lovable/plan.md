# Fix "row-level security policy" error when saving a user's role

## What happens today

Saving a user in User Management removes their old role row and then adds the new
one as two separate database writes from the browser. Each write is checked
individually by the database's access rules, which re-read the *signed-in* user's
own role row at that moment. Two things can make the second write fail with
"new row violates row-level security policy for table user_role_assignments":

- The old row is deleted first. If the person being edited is the signed-in user
  themselves, the delete removes the very row the database uses to confirm the
  editor's permission, so the follow-up insert is rejected — and the editor is
  left with no role at all.
- The delete silently affects zero rows when permission is missing, so the first
  visible sign of trouble is the insert error, which hides the real cause.

Confirmed in the database: the rule on `user_role_assignments` is
`has_screen(auth.uid(),'admin.users') AND (role_key <> 'super_admin' OR is_super_admin(auth.uid()))`,
and `has_screen` resolves the caller's permission from that same table.

## The fix

1. **One safe database action instead of two writes.**
   Add `public.admin_set_user_role(_user_id uuid, _role_key text)` as a
   `SECURITY DEFINER` function that:
   - captures the caller's permission *before* touching any rows
     (`has_screen(auth.uid(),'admin.users')`, otherwise raises a clear
     "User Management access required" message);
   - blocks granting or removing the Sharvi Admin role unless the caller is a
     Sharvi Admin, and blocks the caller removing their own Sharvi Admin role;
   - rejects an unknown role key with a readable message;
   - replaces the assignment (delete + insert) in a single atomic step, so a
     failure never leaves a user with no role;
   - keeps `public.user_roles` in step for callers that read it.
   Granted to `authenticated` only.

2. **App calls the function.**
   In `src/lib/admin.functions.ts`, `setRoleAssignment` calls
   `supabase.rpc("admin_set_user_role", ...)` instead of the direct delete/insert,
   and surfaces the function's message in the error toast. Existing checks in
   `createPortalUser` / `updatePortalUser` stay as they are.

3. **Clearer failure text.**
   The toast shows the database's plain-English reason (for example
   "Only a Sharvi Admin can grant the Sharvi Admin role") instead of the raw
   row-level-security wording.

## Verification

- Sign in as an Admin (User Management granted) and change another user's role —
  saves cleanly.
- Change a user who currently has no role — saves cleanly.
- Attempt to grant Sharvi Admin as a non-Sharvi-Admin — clear refusal message.
- Typecheck with `bunx tsgo --noEmit`.
