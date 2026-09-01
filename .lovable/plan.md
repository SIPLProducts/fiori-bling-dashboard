# Admin access, safe sync, HBL logo

## 1. Admin role can't open User Management / Roles / Screen Permissions

Cause (verified in code): the three admin screens and every admin write operation
are gated on "Sharvi Admin" only, not on the Screen Permissions you granted.

- `src/routes/_authenticated/admin/users.tsx`, `roles.tsx`, `permissions.tsx` each
  render "Not authorised" unless `isSuperAdmin`.
- `src/lib/admin.functions.ts` starts every call with `requireSuperAdmin()`.
- Database policies on `profiles`, `roles`, `role_screens`, `user_role_assignments`
  allow writes only when `is_super_admin(auth.uid())`, so even after the UI opens,
  saving would fail.

Fix:
- Gate each page on its screen key (`admin.users`, `admin.roles`, `admin.permissions`),
  with Sharvi Admin still implicitly allowed — same pattern already used by the
  SAP API Settings page.
- Replace `requireSuperAdmin()` with a screen-based check per operation.
- Add RLS policies so a user holding the matching screen (via `has_screen()`) can
  read/write the admin tables; keep Sharvi Admin as the only role that can grant the
  Sharvi Admin role, change its permissions, or reset another user's password.
- Verify by loading all three screens as `abshankar@hbl.in` (role `admin`).

## 2. Sync must never delete existing data

Current behaviour already matches the requirement — the sync only upserts on
`record_key` (insert when new, update when it exists) and contains no delete.
Two hardening changes:

- When the API returns zero rows, skip all writes and log the run as
  "no data — nothing changed" instead of an error, so an empty response is never
  treated as a failure or a reason to touch existing rows.
- Rows the API omits are left untouched by definition; the run log will show
  received / inserted / updated counts so this is visible on the Scheduler tab.

## 3. Navbar logo

Replace the "NEXUS" text badge in `src/components/shell-bar.tsx` with the HBL logo
(`src/assets/hbl-logo.png.asset.json`, already used on the login page), sized for the
14px-tall navbar, linking to the launchpad. The "Procurement Analytics" subtitle stays.

## Technical notes

- New/updated migration: policies using `public.has_screen(auth.uid(), 'admin.users')`
  etc. on `profiles` (update), `roles`, `role_screens`, `user_role_assignments`;
  `GRANT`s already exist on these tables.
- Guarded RPCs `admin_set_user_password` and `admin_confirm_user_email` stay
  Sharvi-Admin-only.
