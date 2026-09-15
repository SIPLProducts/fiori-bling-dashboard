# Copy Quality access and SAP settings into Production

Production login and the launchpad now load correctly, so the frontend and authentication are no longer blocking access. The Production screenshot identifies the immediate issue: `masteradmin@sharviinfotech.com` is being evaluated as **Viewer**, while Quality evaluates the same account as **Sharvi Admin**. The application builds its menus and tiles from `public.user_role_assignments` and `public.role_screens`; a `super_admin` assignment gives every screen automatically. Quality’s current users, roles, screen permissions, and SAP settings should be copied into Production without touching sales rows or Docker volumes.

## Recovery steps

1. **Back up the affected Production data**
   - Save Production Auth accounts and identities plus `profiles`, `roles`, `role_screens`, `user_role_assignments`, legacy `user_roles`, and the SAP configuration tables before changing them.
   - Do not rerun the full Production upgrade and do not copy or truncate sales/SAP data.

2. **Compare Quality and Production data**
   - Find `masteradmin@sharviinfotech.com` in `auth.users` and confirm its matching active `profiles` row.
   - Compare that user’s `user_role_assignments` rows between Quality and Production.
   - Confirm Production contains the `super_admin` role and the required access-control migrations, grants, and read policies.
   - Check the legacy `user_roles` row separately, but treat `user_role_assignments` as authoritative because that is what the current portal reads.
   - Compare row counts and keys for `sap_systems`, `sap_endpoints`, `sap_middleware_config`, `sap_table_mappings`, and `sap_table_fields`.

3. **Create a focused Quality-to-Production copy utility**
   - Add `deploy/production-copy-access-sap.sh`; this is safer than a single pasted SQL query because Quality and Production run in separate database containers.
   - Export from `mis_q_db` with `pg_dump --data-only --column-inserts --disable-triggers`:
     - `auth.users`, `auth.identities`, and `public.profiles` for login accounts;
     - `public.roles`, `public.role_screens`, `public.user_role_assignments`, and `public.user_roles` for roles and screen access;
     - `public.sap_systems`, `public.sap_endpoints`, `public.sap_middleware_config`, `public.sap_table_mappings`, and `public.sap_table_fields` for SAP settings.
   - Do not copy `zfisales_detail`, sync history, encrypted SAP credentials, encryption keys, or any Docker/backend secrets in this focused repair.
   - Require an explicit `--confirm-copy-quality-access-sap` flag before replacing these Production rows.

4. **Import in a foreign-key-safe transaction**
   - Stop `mis-p-middleware` before the copy so the scheduler cannot read partially replaced settings.
   - Clear only the listed Production tables in child-to-parent order, then import the Quality snapshot with triggers temporarily disabled for that transaction.
   - Preserve matching Quality Auth IDs and password hashes so assignments continue to reference the correct users.
   - After import, enforce Production-only values: middleware port `3010`, middleware URL `http://10.10.4.165:9000/middleware`, and keep all endpoint schedules disabled until validation completes.
   - Never truncate `zfisales_detail` and never use `docker compose down -v`.

5. **Validate database API visibility**
   - Query `user_role_assignments` through Production’s database API using the signed-in account and confirm it can read `super_admin`.
   - If direct SQL is correct but the API response is empty, repair the table grants/read policy and reload the Production database API schema cache.
   - Confirm `is_super_admin(user_id)` and `has_screen(user_id, 'admin.users')` return true from an authenticated application request.

6. **Refresh the Production session**
   - Sign out of Production, clear only the Production site session/cache, and sign in again.
   - Confirm the account menu shows User Management, Roles, Screen Permissions, and SAP API Settings.
   - Confirm launchpad tiles match Quality and the role headline shows Sharvi Admin rather than Viewer.

7. **Validate SAP before scheduling**
   - Restart `mis-p-middleware` with its existing Production `.env`; the copy utility must not replace passwords or service keys.
   - Confirm it listens on `3010`, reads the copied endpoint list, and completes one manual `Sales_Reports_KPI` sync.
   - Re-enable only the schedules that were enabled in Quality after the manual Production sync succeeds.

8. **Prevent recurrence**
   - Add post-upgrade checks to `production-upgrade-all.sh` verifying every copied active profile has a role assignment and that the copied masteradmin account is `super_admin` before declaring success.
   - Document the focused copy command, verification queries, and rollback command in `PRODUCTION-UPGRADE.md`.

## Expected result

Production has the same users, roles, screen permissions, and non-secret SAP settings as Quality. Signing in as `masteradmin@sharviinfotech.com` produces the same Sharvi Admin menus and launchpad tiles, without replacing Production sales data or secrets.