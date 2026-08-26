# Fix "Email not confirmed" login error

## Problem
Users created from the User Management screen (e.g. `sharvi`) are created through a normal sign-up call, so their email stays unconfirmed. Since the portal has no email-verification flow, they can never log in and see **"Email not confirmed"**.

## Fix

1. **Confirm existing accounts (one-off)**
   - Run SQL to set `email_confirmed_at` for the `sharvi` account (and any other existing unconfirmed users) in `auth.users`, so they can log in immediately.

2. **Auto-confirm new admin-created users (permanent fix)**
   - Add a security-definer SQL function `public.admin_confirm_user_email(_user_id uuid)` that sets `email_confirmed_at` in `auth.users` and is callable only by Sharvi Admins (checks `has_role`/`user_role_assignments`).
   - In `createPortalUser` (`src/lib/admin.functions.ts`), call this RPC right after `signUp` so every user created from User Management is instantly confirmed and can log in with the password set by the admin.

3. **Verify**
   - Log in as `sharvi` with the set password on `/auth` and confirm access to the launchpad.

## Technical details
- One migration: `CREATE OR REPLACE FUNCTION public.admin_confirm_user_email(...)` (security definer, `set search_path = public`), plus `GRANT EXECUTE TO authenticated`.
- One-off SQL: `UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;`
- Frontend change limited to one added RPC call in `createPortalUser`; no UI changes.
