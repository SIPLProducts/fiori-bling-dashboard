# Restore Production access for masteradmin

Production login and the launchpad now load correctly, so the frontend and authentication are no longer blocking access. The Production screenshot identifies the remaining issue: `masteradmin@sharviinfotech.com` is being evaluated as **Viewer**, while Quality evaluates the same account as **Sharvi Admin**. The application builds its menus and tiles from `public.user_role_assignments` and `public.role_screens`; a `super_admin` assignment gives every screen automatically.

## Recovery steps

1. **Back up the Production access rows**
   - Save the current `roles`, `role_screens`, `user_role_assignments`, and legacy `user_roles` rows before changing them.
   - Do not rerun the full Production upgrade and do not copy or truncate sales/SAP data.

2. **Compare Quality and Production access data**
   - Find `masteradmin@sharviinfotech.com` in `auth.users` and confirm its matching active `profiles` row.
   - Compare that user’s `user_role_assignments` rows between Quality and Production.
   - Confirm Production contains the `super_admin` role and the required access-control migrations, grants, and read policies.
   - Check the legacy `user_roles` row separately, but treat `user_role_assignments` as authoritative because that is what the current portal reads.

3. **Repair only the affected Production assignment**
   - Remove any incorrect `viewer` assignment for the Production masteradmin account.
   - Insert `super_admin` into `public.user_role_assignments` for that account, using its Production Auth user ID.
   - Keep `public.user_roles` synchronized with the equivalent administrator role where required by older functions.
   - Do not recreate the Auth user or change its password/profile.

4. **Validate database API visibility**
   - Query `user_role_assignments` through Production’s database API using the signed-in account and confirm it can read `super_admin`.
   - If direct SQL is correct but the API response is empty, repair the table grants/read policy and reload the Production database API schema cache.
   - Confirm `is_super_admin(user_id)` and `has_screen(user_id, 'admin.users')` return true from an authenticated application request.

5. **Refresh the Production session**
   - Sign out of Production, clear only the Production site session/cache, and sign in again.
   - Confirm the account menu shows User Management, Roles, Screen Permissions, and SAP API Settings.
   - Confirm launchpad tiles match Quality and the role headline shows Sharvi Admin rather than Viewer.

6. **Prevent recurrence**
   - Add a focused `deploy/production-fix-access.sh` utility that accepts an email, resolves the Production Auth ID, backs up the current access rows, and safely assigns the requested existing role.
   - Add post-upgrade checks to `production-upgrade-all.sh` verifying every copied active profile has a role assignment and that the copied masteradmin account is `super_admin` before declaring success.
   - Document the verification and rollback commands in `PRODUCTION-UPGRADE.md`.

## Expected result

Signing in to `http://10.10.4.165:9000` as `masteradmin@sharviinfotech.com` produces the same Sharvi Admin menus, administration screens, and launchpad tiles shown in Quality, without replacing Production business data.