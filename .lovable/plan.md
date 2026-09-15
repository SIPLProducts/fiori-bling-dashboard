# Recover the incomplete Production upgrade

Restore the existing Production installation at `http://10.10.4.165:9000` without deleting Docker volumes or overwriting working Production data again. Production’s two Auth accounts and matching profile rows are present and accessible through port `9000`, so missing users are not causing the login problem. The “Opening HBL MIS Portal…” screen is static HTML; application startup hides it immediately before checking login. Because it remains visible, the Production JavaScript bundle is not starting. The middleware is separately healthy on port `3010`, but its database API still reports `public.sap_endpoints` as absent. Recovery therefore has two focused tracks: repair the deployed frontend bundle/assets, then repair the Production database API schema visibility.

## Immediate recovery sequence

1. **Freeze automated activity**
   - Stop `mis-p-middleware` temporarily so the scheduler does not repeat failed database requests.
   - Do not rerun the Quality-to-Production data replacement and do not use `docker compose down -v`.

2. **Inspect the current Production state**
   - Confirm all Production containers and ports `5433`, `9010`, `9012`, `3010`, and `9000`.
   - Query Production directly for `public.sap_endpoints`, `public.profiles`, `auth.users`, `public.zfisales_detail`, and the migration ledger; confirm the two visible Auth accounts also have active profile rows and role assignments.
   - Request `sap_endpoints` through the same port `9010`, service key, and headers used by the middleware, then compare that result with direct SQL. This distinguishes a missing table from a stale database API cache or a gateway connected to the wrong Production database.
   - Check whether the post-24-August migration files exist under the Production repository, and compare the ledger with the files actually present.
   - Extract every JavaScript and stylesheet path referenced by `frontend/dist/index.html`; verify each file exists, is readable by Nginx, and returns the correct content type rather than HTML or `404`.
   - Request `/`, `/auth`, one referenced asset, `/supabase/auth/v1/health`, `/supabase/rest/v1/`, and `/healthz` locally; capture the first failing browser request responsible for the endless “Opening HBL MIS Portal…” screen.

3. **Repair the database schema safely**
   - Take a fresh timestamped Production database backup first.
   - If direct SQL confirms missing objects, apply the missing migrations in filename order using `supabase_admin` and record each only after it succeeds.
   - Do not truncate or recopy Production data during this recovery.
   - Verify that `sap_endpoints` and its related SAP tables, grants, policies, functions, and the `posting_range` column exist.
   - If direct SQL confirms the tables already exist, do not reapply migrations blindly; restart/reload only the Production database API and verify it points to `mis_p_db`, then reload its schema cache.

4. **Restore the Production login page**
   - Rebuild the static frontend from the latest repository with Production values: database API `http://10.10.4.165:9000/supabase`, Production anon key, and project ID `mis-production`.
   - Validate the new build before installation: `index.html` exists, every referenced local asset exists, and the bundle contains the Production database URL rather than the hosted or Quality URL.
   - Replace `frontend/dist` atomically while retaining the current folder as a rollback copy.
   - Set readable directory/file permissions for Nginx, clear only the old hashed frontend assets during the atomic swap, and preserve `index.html` as `no-store`.
   - Test Nginx before reload, then verify `/auth` renders and its JavaScript/CSS assets return `200`.

5. **Correct and restart middleware**
   - Verify the middleware uses port `3010`, Production database API `http://127.0.0.1:9010`, and the Production service key.
   - Recheck the SAP DEV address because the current Production log shows `http://10.10.4.18:9010`, while the previously working Quality address was `http://10.10.4.18:8000`; preserve the intended Production value rather than silently guessing.
   - Rotate the middleware shared secret because the value was pasted into chat and Nginx; update both middleware and Nginx together.
   - Recreate `mis-p-middleware` with inherited port/database variables removed, then confirm `listening on :3010`, `scheduler started`, and a successful scheduler configuration read.

6. **Validate before enabling schedules**
   - Confirm every Production Auth account expected from Quality has an active profile and role assignment; repair missing profile/role rows without recreating valid Auth accounts.
   - Confirm login resolution and sign-in for a copied Production user.
   - Compare Production user and sales-row counts with the expected copied snapshot.
   - Test `/healthz`, database auth health, middleware health, and `/sap-mw/health`.
   - Run one manual `Sales_Reports_KPI` sync and verify received/new/updated counts.
   - Enable the copied schedules only after the manual sync succeeds.

## Deployment package hardening

- Update `production-upgrade-all.sh` so it fails before data copy or middleware startup when the migration directory is empty or required baseline tables are absent.
- Make it verify every required post-upgrade table and column after migration, including `sap_endpoints`, before continuing.
- Add a recovery mode that performs backup, missing migrations, frontend deployment, and validation without truncating or copying Quality data.
- Add explicit frontend checks for `index.html`, referenced assets, `/auth`, and database-auth health.
- Add a dedicated `deploy/production-recover.sh` that stops the scheduler, takes a fresh backup, rebuilds and atomically redeploys only the Production frontend, checks all referenced assets over port `9000`, repairs database API visibility, validates profiles/roles, and restarts middleware. It must not truncate tables or copy Quality data.
- Add a same-credential database API probe for `sap_endpoints` and fail before starting middleware when the API cannot see the migrated schema.
- Extend `PRODUCTION-UPGRADE.md` with this incomplete-upgrade recovery command sequence and expected results.
- Keep the Nginx secret as a deployment placeholder in Git; never commit the real replacement value.

## Expected result

Production serves the login page at `http://10.10.4.165:9000/auth`, the database contains `public.sap_endpoints`, PM2 runs `mis-p-middleware` on `3010` without scheduler tick errors, and SAP schedules remain disabled until one manual Production sync passes.