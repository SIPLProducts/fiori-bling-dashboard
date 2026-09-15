# Production deployment package for 10.10.4.165:9000

Create a Production deployment package under `deploy/` that repeats the proven Quality setup while keeping Production isolated and copying the current Quality users, permissions, SAP settings, and sales data.

## Production ports

| Service | Production port |
| --- | ---: |
| Portal through Nginx | 9000 |
| SAP middleware | 3010 |
| Backend service | 5001 |
| Database API gateway | 9010 |
| Database Studio | 9012 |
| PostgreSQL | 5433 |

## Files to add or update

- Add `deploy/production-deploy-all.sh`: one guided script for preflight checks, backup, database startup/migrations, Quality-to-Production data copy, frontend deployment, middleware installation, PM2 restart, Nginx installation, and final health checks.
- Add `deploy/PRODUCTION-DEPLOYMENT.md`: short copy/paste instructions, required files, expected success messages, rollback steps, and troubleshooting.
- Update `deploy/nginx/mis-production.conf` for port `9000` and add the required `/sap-mw/` bridge with 10-minute SAP timeouts and server-side shared-secret injection.
- Correct `deploy/docker/docker-compose.production.yml` to use `supabase_admin` consistently and bind the Production API gateway to `127.0.0.1:9010` instead of exposing it on every network interface.
- Add a Production middleware environment template without real passwords or keys.

## One-run deployment flow

1. Validate all Production and Quality folders, required files, Docker containers, free ports, and secret variables before changing anything.
2. Create timestamped backups of the existing Production database, frontend, middleware configuration, and Nginx file.
3. Install the corrected Production Docker, gateway, role, and migration files; start or update containers without deleting volumes.
4. Apply every migration in order using `supabase_admin`, including the rolling Posting Date range update.
5. Copy from Quality into Production:
   - login accounts and identities, preserving current password hashes;
   - profiles, roles, role assignments, and screen permissions;
   - SAP systems, endpoints, table mappings/fields, middleware settings, and sync history;
   - all `zfisales_detail` rows.
6. Keep Production-specific values after the copy: middleware port `3010`, middleware URL `http://10.10.4.165:9000/middleware`, database API `http://127.0.0.1:9010`, and Production keys from `Production/backend/.env`.
7. Deploy the Production static frontend built specifically with `http://10.10.4.165:9000/supabase` and the Production anon key.
8. Install middleware dependencies, regenerate `sync-core.mjs`, and recreate PM2 as `mis-p-middleware` with a clean environment so no Quality or inherited `PORT` value overrides `3010`.
9. Install/reload Nginx only after `nginx -t` passes.
10. Verify login resolution, row counts, sales totals, `/healthz`, `/supabase/`, `/middleware/health`, `/sap-mw/health`, PM2 scheduler startup, and one manual SAP synchronization.

## Safety controls

- Require an explicit confirmation flag before replacing Production application data with Quality data.
- Never run `docker compose down -v`; Production volumes are retained.
- Stop immediately on the first failed command and leave timestamped backups for rollback.
- Never print or commit database keys, SAP passwords, or the middleware shared secret.
- Copy the shared secret and SAP credentials server-side from the working Quality middleware file, then replace only Production-specific ports, URLs, and database key.
- Use small lookup batches and 500-row writes so scheduled SAP responses of 30,000+ rows remain supported.

## Production Nginx corrections

The supplied Nginx file is missing `/sap-mw/`, which the static portal requires for Test and manual sync. The deployment version will retain `listen 9000`, proxy middleware to `3010`, API gateway to `9010`, Studio to `9012`, and add the secure bridge. The middleware shared-secret placeholder must be filled from the server during deployment, not committed to Git.

## Validation result expected

Production opens at `http://10.10.4.165:9000`, users copied from Quality can sign in, dashboards show the copied sales totals, SAP Test works through `/sap-mw/`, and PM2 logs show `v1.3.0 listening on :3010` plus `scheduler started` with dynamic endpoint schedules.
