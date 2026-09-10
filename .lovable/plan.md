# Screen access = full control, plus Delete user

## Problem

Signed in with the Admin role you can edit a user's details, but saving a new
password fails with "Forbidden: Sharvi Admin role required". Password reset is
still locked to Sharvi Admin, both in the app and in the database rule behind
it. There is also no way to delete a user.

## What changes

1. **Screen access grants full control.** Whoever is granted a screen can
   create, edit, update and delete on that screen — including setting or
   resetting another user's password in User Management. No action inside a
   granted screen stays Sharvi-Admin-only.
2. **Delete user.** Each row in the user list gets a Delete action. Clicking it
   opens a confirmation popup ("Delete user? This cannot be undone." with
   Delete / Cancel). Confirming removes the account, its profile and its role
   assignment; a message confirms the result and the list refreshes.
3. **Safety rules that stay.** You cannot delete your own account. Only a
   Sharvi Admin can delete, or change the password of, a Sharvi Admin — anyone
   else gets a clear message instead of a silent failure.

## Technical notes

- `src/lib/admin.functions.ts`
  - `updatePortalUser`: password branch uses
    `requireScreen("admin.users", "User Management")` instead of
    `requireSuperAdmin()`.
  - New `deletePortalUser({ data: { id } })`: screen check, self-delete guard,
    then `supabase.rpc("admin_delete_user", { _user_id })`.
- Migration
  - Redefine `public.admin_set_user_password` with guard
    `public.has_screen(auth.uid(), 'admin.users')`, plus a check that raises
    when the target holds `super_admin` and the caller is not a Sharvi Admin.
    Keeps `SECURITY DEFINER`, the 8-character minimum and the user-exists check.
  - New `public.admin_delete_user(_user_id uuid)` `SECURITY DEFINER`: same
    screen guard and Sharvi-Admin protection, blocks self-delete, deletes from
    `public.user_role_assignments`, `public.user_roles`, `public.profiles` and
    `auth.users`.
  - Add a `DELETE` policy on `public.profiles` for holders of `admin.users`
    (currently deletes are denied) so the app path stays consistent.
- `src/routes/_authenticated/admin/users.tsx`: Delete button per row using the
  existing shadcn `AlertDialog` for the confirm/cancel popup, wired to the new
  function with a toast on success/failure.
- Verify by editing a password and deleting a test user while signed in with
  the Admin role.
