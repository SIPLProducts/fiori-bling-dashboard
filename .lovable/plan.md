# Production deployment package for 10.10.4.165:9000

Upgrade the **existing, already-running Production installation**, currently at the 24 August 2026 version, using files inside the current `deploy/` folder. Keep its established folder layout and Docker volumes, deploy all newer application/middleware/database changes already proven in Quality, add the currently missing Production middleware, and copy the current Quality users, permissions, SAP settings, and sales data into Production.

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

- Add `deploy/production-upgrade-all.sh`: one guided **in-place upgrade** script for preflight checks, backups, migrations, Quality-to-Production data copy, frontend replacement, middleware update, PM2 restart, Nginx update, and final health checks.
- Add `deploy/PRODUCTION-UPGRADE.md`: short copy/paste instructions for upgrading the existing server, expected success messages, rollback steps, and troubleshooting.
- Update the existing `deploy/nginx/mis-production.conf` for its current port `9000` and add the required `/sap-mw/` bridge with 10-minute SAP timeouts and server-side shared-secret injection.
- Correct the existing `deploy/docker/docker-compose.production.yml` to use `supabase_admin` consistently and bind the Production API gateway to `127.0.0.1:9010` instead of exposing it on every network interface.
- Add a Production middleware environment template without real passwords or keys.
- Keep the existing Quality deployment files unchanged; Production additions live beside them in the same `deploy/` folder.

## One-run deployment flow

1. Validate the existing Production and Quality folders, current Docker containers, PM2 process, ports, required files, and secret variables before changing anything.
2. Create timestamped backups of the existing Production database, frontend, middleware configuration, and Nginx file.
3. Update the existing Production Docker, gateway, role, and migration files in place; recreate only changed containers and never delete volumes.
4. Apply the 31 migration files after 24 August 2026, in filename order using `supabase_admin`, including the latest access-control, scheduler, large-sync, and rolling Posting Date updates. Record each successful file in a Production migration ledger so rerunning the upgrade skips completed files.
5. Copy from Quality into Production:
   - login accounts and identities, preserving current password hashes;
   - profiles, roles, role assignments, and screen permissions;
   - SAP systems, endpoints, table mappings/fields, middleware settings, and sync history;
   - all `zfisales_detail` rows.
6. Keep the existing Production secrets and environment identity. After copying Quality application data, enforce Production-specific values: middleware port `3010`, middleware URL `http://10.10.4.165:9000/middleware`, database API `http://127.0.0.1:9010`, and Production keys from `Production/backend/.env`.
7. Build and deploy a Production-specific static frontend with `VITE_SUPABASE_URL=http://10.10.4.165:9000/supabase`, the Production `ANON_KEY`, and project ID `mis-production`; do not reuse the Quality bundle.
8. Populate the previously missing `/opt/MIS_Projects/Production/middleware` from the repository middleware folder, install dependencies including the Node 20 WebSocket support, regenerate `sync-core.mjs`, create its Production `.env`, and start PM2 as `mis-p-middleware` with a clean environment so no Quality or inherited `PORT` value overrides `3010`.
9. Install/reload Nginx only after `nginx -t` passes.
10. Verify login resolution, row counts, sales totals, `/healthz`, `/supabase/`, `/middleware/health`, `/sap-mw/health`, PM2 scheduler startup, and one manual SAP synchronization.

## Safety controls

- Require an explicit confirmation flag before replacing Production application data with Quality data.
- Never run `docker compose down -v`; Production volumes are retained.
- Stop immediately on the first failed command and leave timestamped backups for rollback.
- Never print or commit database keys, SAP passwords, or the middleware shared secret.
- Copy the shared secret and SAP credentials server-side from the working Quality middleware file, then replace only Production-specific ports, URLs, and database key.
- Use small lookup batches and 500-row writes so scheduled SAP responses of 30,000+ rows remain supported.
- Copy SAP endpoint settings but initially keep the Production scheduler stopped during the upgrade; enable it only after the Production SAP Test and manual sync both pass, avoiding simultaneous incorrect writes.

## Production Nginx corrections

The currently running Production Nginx configuration is older and missing `/sap-mw/`, which the updated static portal requires for Test and manual sync. It will be backed up and upgraded in place. The deployment version will retain `listen 9000`, proxy middleware to `3010`, API gateway to `9010`, Studio to `9012`, and add the secure bridge. The middleware shared-secret placeholder must be filled from the server during deployment, not committed to Git.

## Validation result expected

Production opens at `http://10.10.4.165:9000`, users copied from Quality can sign in, dashboards show the copied sales totals, SAP Test works through `/sap-mw/`, and PM2 logs show `v1.3.0 listening on :3010` plus `scheduler started` with dynamic endpoint schedules.

## Existing Production configuration findings

- Port `9000` is the correct Production portal port and will remain unchanged.
- The active Nginx file needs the new `/sap-mw/` block used successfully in Quality.
- The pasted Docker file still checks/connects as `postgres`; the repository's corrected stack uses `supabase_admin`.
- The API gateway is currently exposed as `0.0.0.0:9010`; it will be restricted to `127.0.0.1:9010` because Nginx is the public entry point.
- Production currently has no middleware deployment; it will be installed on `3010`, while Quality remains on `3002`.
