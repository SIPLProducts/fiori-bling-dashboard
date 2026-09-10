# On-prem scheduler: changes made and server steps

## What was changed

The self-hosted portal is a static SPA, so there is no always-running app server to receive a database timer. The fix moves the scheduler into the SAP middleware service, which already runs 24/7 under PM2 and already reaches both SAP and the local database.

### New files

- `middleware/scheduler.mjs` — one-minute tick, reads saved endpoints from the local database, checks which ones are due, runs them, and writes run history.
- `middleware/src/sync-core.entry.ts` — small entry file that re-exports the app's existing SAP row-mapping and payload-salvage helpers.
- `middleware/sync-core.mjs` — generated bundle from the entry file, built with esbuild. This keeps mapping logic in one place instead of duplicating it.

### Modified files

- `middleware/server.mjs` — imports the scheduler, exposes protected `POST /sync/run` (manual trigger) and `GET /sync/status`, starts the scheduler at startup.
- `middleware/package.json` — added `@supabase/supabase-js` and `esbuild`; added `build:sync-core` script.
- `middleware/.env.example` — added `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the on-prem scheduler.
- `deploy/README.md` — updated with scheduler setup and a one-line manual-run command.

### Behaviour

- Everything the scheduler uses is read live from the database every minute: cron expression, on/off switch, endpoint path/method/query/headers/body, active flag, SAP system and client.
- It calls SAP the same way the Test button does, maps rows with the same shared logic, and upserts into `zfisales_detail` on `record_key`.
- It inserts a `sap_sync_runs` row for every run, so the Scheduler tab shows Last run, record counts, and status.
- Empty SAP responses do not delete existing data.
- A single-run guard prevents overlapping runs of the same endpoint.

## What you have to do on the server

Run these on the Quality server (the same server where `mis-q-middleware` is running under PM2).

### 1. Add the two scheduler environment variables

Edit `/opt/MIS_Projects/Quality/middleware/.env` and add:

```dotenv
SUPABASE_URL=http://127.0.0.1:8000
SUPABASE_SERVICE_ROLE_KEY=<your Quality service role key>
```

- `SUPABASE_URL` is the local database API gateway (Kong) address. If your Supabase stack runs on the same machine, `http://127.0.0.1:8000` is usually correct.
- `SUPABASE_SERVICE_ROLE_KEY` is the server-only service role key for your self-hosted Quality instance. It must never go into the browser or into `VITE_*` variables.

### 2. Install the new middleware dependencies

```bash
cd /opt/MIS_Projects/Quality/middleware
npm install
```

This installs `@supabase/supabase-js` and `esbuild`.

### 3. Build the shared sync bundle

```bash
cd /opt/MIS_Projects/Quality/middleware
npm run build:sync-core
```

This creates `middleware/sync-core.mjs`. Verify it exists:

```bash
ls -l /opt/MIS_Projects/Quality/middleware/sync-core.mjs
```

### 4. Restart the middleware PM2 process

```bash
pm2 restart mis-q-middleware
```

### 5. Check the startup log

```bash
pm2 logs mis-q-middleware --lines 50
```

You should see either:

```
scheduler started — schedules are read from the portal every minute
```

or, if the env vars are missing:

```
scheduler DISABLED — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in middleware/.env to enable automatic syncing
```

### 6. Force one manual run to confirm it works

```bash
curl -X POST http://127.0.0.1:3002/sync/run \
  -H "Content-Type: application/json" \
  -H "x-shared-secret: <MIDDLEWARE_SHARED_SECRET from .env>" \
  -d '{"endpoint":"Sales_Reports_KPI"}'
```

Replace `3002` with the middleware port and use the real shared secret. A successful run returns JSON with `status: "synced"` and record counts.

### 7. Verify in the portal

Open SAP API Settings → Scheduler tab. Within a minute of the saved cron being due, refresh the page. You should see:

- Last run: updated timestamp
- Record counts matching the manual run
- Sync history rows appearing

## Notes

- The existing hosted pg_cron setup is left untouched. It is only used by the Lovable cloud deployment.
- SAP credentials (password) still come from the middleware `.env`; only schedule/endpoint configuration is read from the database.
- If the server timezone is UTC but your cron is meant for IST, set `TZ=Asia/Kolkata` in the PM2 environment or adjust the cron expression accordingly.
