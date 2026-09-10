# Let User Management holders change passwords

## Problem

Signed in with the Admin role you can edit a user's details, but saving a new
password fails with "Forbidden: Sharvi Admin role required". Password reset is
the only user action still locked to Sharvi Admin — both in the app and in the
database rule behind it.

## What changes

- Anyone whose role grants the **User Management** screen can set or reset
  another user's password, exactly like the other fields in the Edit user form.
- One safety rule stays: only a Sharvi Admin can change a Sharvi Admin's
  password. A normal Admin attempting that gets a clear message instead of a
  silent failure.
- No change to who can open User Management, and no change to the Sharvi Admin
  role itself.

## Technical notes

- `src/lib/admin.functions.ts`: in `updatePortalUser`, replace the
  `requireSuperAdmin()` call in the password branch with
  `requireScreen("admin.users", "User Management")`.
- Migration: redefine `public.admin_set_user_password` so the guard is
  `public.has_screen(auth.uid(), 'admin.users')` instead of
  `public.is_super_admin(auth.uid())`, plus a new check that raises when the
  target user holds `super_admin` and the caller is not a Sharvi Admin. Keeps
  `SECURITY DEFINER`, the 8-character minimum and the user-exists check.
- Verify by editing a user's password while signed in with the Admin role.
