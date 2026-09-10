# Why the scheduler still isn't running on Quality

## What the evidence shows

- PM2 reports `mis-q-middleware` version **1.0.0**. The scheduler build is **1.3.0**. The server is running an old copy of the middleware.
- The PM2 log only shows `POST /sap/call` (manual Test button). There is no `scheduler started` line, so no timed sync exists on that machine.
- Your screenshot of the middleware folder lists only `.env`, `.env.example`, `bun.lock`, `Dockerfile`, `package.json`, `README.md`, `server.mjs`. The three new files are missing.
- The new files **are** already pushed to `origin/main` (commit `d2de26a`, "Added scheduled sync to server"): `middleware/scheduler.mjs`, `middleware/sync-core.mjs`, `middleware/src/sync-core.entry.ts`, `deploy/enable-scheduler.sh`, plus an updated `middleware/server.mjs` and `middleware/package.json`. Verified against the remote branch. Your D: folder and the Quality server simply have not pulled since 02-09; a `git pull` on each brings them in.

So nothing is broken in the code — the copy on the Quality server (and on your D: drive) is simply out of date. Your `.env` values are fine; two extra lines are still needed.

## What to do on the Quality server

1. Update the checkout so it includes commit `d2de26a`:
   ```bash
   cd /opt/MIS_Projects/Quality
   git fetch --all
   git pull
   ```
   If that folder is not a git checkout, copy these files from your machine after pulling there:
   `middleware/scheduler.mjs`, `middleware/sync-core.mjs`, `middleware/src/sync-core.entry.ts`, `middleware/server.mjs`, `middleware/package.json`, `deploy/enable-scheduler.sh`.

2. Add two server-only lines to `/opt/MIS_Projects/Quality/middleware/.env` (keep everything you already have):
   ```dotenv
   SUPABASE_URL=http://127.0.0.1:8000
   SUPABASE_SERVICE_ROLE_KEY=<Quality service role key>
   ```

3. Install and restart:
   ```bash
   cd /opt/MIS_Projects/Quality/middleware
   npm install
   pm2 restart mis-q-middleware --update-env
   pm2 logs mis-q-middleware --lines 30
   ```
   Expect `v1.3.0 listening on :3002` and `scheduler started`.

4. Force one run to confirm:
   ```bash
   curl -X POST http://127.0.0.1:3002/sync/run \
     -H 'content-type: application/json' \
     -H 'x-shared-secret: bf4a75740a9b2655be4bd2bc08745c4a' \
     -d '{"endpoint":"Sales_Reports_KPI"}'
   ```
   Then check SAP API Settings, Scheduler tab: "Last run" and history should populate.

## Notes

- `deploy/enable-scheduler.sh` does steps 3 and 4 automatically once the files are present.
- The scheduler reads cron, active flags, dates and system settings from the database each minute, so any change made in the SAP API Settings screen takes effect without a restart.
- Server timezone matters: cron times are matched against the server clock. If IST times are expected, the box should be on IST (`timedatectl`).
- Nothing in the app source needs to change for this. If you want, I can also rotate the shared secret you pasted here, since it is now exposed in chat.
