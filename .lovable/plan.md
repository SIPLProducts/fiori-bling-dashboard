# Recover the incomplete Production upgrade

Restore the existing Production installation at `http://10.10.4.165:9000` without deleting Docker volumes or overwriting working Production data again. The middleware is online on port `3010`, but its database request confirms that `public.sap_endpoints` is absent. The supplied Nginx configuration already has the required static-page fallback and service paths, so the login-page failure must be diagnosed from the deployed frontend files and actual HTTP responses before changing Nginx.

## Immediate recovery sequence

1. **Freeze automated activity**
   - Stop `mis-p-middleware` temporarily so the scheduler does not repeat failed database requests.
   - Do not rerun the Quality-to-Production data replacement and do not use `docker compose down -v`.

2. **Inspect the current Production state**
   - Confirm all Production containers and ports `5433`, `9010`, `9012`, `3010`, and `9000`.
   - Query Production directly for `public.sap_endpoints`, `public.profiles`, `public.zfisales_detail`, and the migration ledger.
   - Check whether the post-24-August migration files exist under the Production repository, and compare the ledger with the files actually present.
   - Check `frontend/dist/index.html`, its referenced `/assets/*` files, file permissions, and Nginx access/error logs.
   - Request `/`, `/auth`, one referenced asset, `/supabase/auth/v1/health`, and `/healthz` locally to identify whether login failure is a missing build, missing asset, permissions problem, or unavailable database API.

3. **Repair the database schema safely**
   - Take a fresh timestamped Production database backup first.
   - Apply the missing migrations in filename order using `supabase_admin` and record each only after it succeeds.
   - Do not truncate or recopy Production data during this recovery.
   - Verify that `sap_endpoints` and its related SAP tables, grants, policies, functions, and the `posting_range` column exist.
   - Reload the database API schema cache after the migrations.

4. **Restore the Production login page**
   - If the deployed build is absent or incomplete, rebuild it with Production values: database API `http://10.10.4.165:9000/supabase`, Production anon key, and project ID `mis-production`.
   - Replace `frontend/dist` atomically while retaining the current folder as a rollback copy.
   - If files are intact, correct only the diagnosed Nginx path, permissions, or database API issue.
   - Test Nginx before reload, then verify `/auth` renders and its JavaScript/CSS assets return `200`.

5. **Correct and restart middleware**
   - Verify the middleware uses port `3010`, Production database API `http://127.0.0.1:9010`, and the Production service key.
   - Recheck the SAP DEV address because the current Production log shows `http://10.10.4.18:9010`, while the previously working Quality address was `http://10.10.4.18:8000`; preserve the intended Production value rather than silently guessing.
   - Rotate the middleware shared secret because the value was pasted into chat and Nginx; update both middleware and Nginx together.
   - Recreate `mis-p-middleware` with inherited port/database variables removed, then confirm `listening on :3010`, `scheduler started`, and a successful scheduler configuration read.

6. **Validate before enabling schedules**
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
- Extend `PRODUCTION-UPGRADE.md` with this incomplete-upgrade recovery command sequence and expected results.
- Keep the Nginx secret as a deployment placeholder in Git; never commit the real replacement value.

## Expected result

Production serves the login page at `http://10.10.4.165:9000/auth`, the database contains `public.sap_endpoints`, PM2 runs `mis-p-middleware` on `3010` without scheduler tick errors, and SAP schedules remain disabled until one manual Production sync passes.