# Getting the middleware scheduler running on Quality

## What we know now

- The new files did reach the server: the latest PM2 error is `Cannot find package '@supabase/supabase-js' imported from .../scheduler.mjs` — that file only exists in the new build.
- The crash is just missing npm dependencies. `package.json` now lists `@supabase/supabase-js` and `esbuild`, but `npm install` has not been run on the server since the files were copied.

## Immediate fix (do this now)

```bash
cd /opt/MIS_Projects/Quality/middleware
npm install
pm2 restart mis-q-middleware --update-env
pm2 logs mis-q-middleware --lines 30
```

Expect `v1.3.0 listening on :3002` and `scheduler started`. That is the whole fix for the current error.

## Remaining setup (one time)

1. Add two server-only lines to `/opt/MIS_Projects/Quality/middleware/.env` (keep everything already there):
   ```dotenv
   SUPABASE_URL=http://127.0.0.1:8000
   SUPABASE_SERVICE_ROLE_KEY=<Quality service role key>
   ```
   Then restart again: `pm2 restart mis-q-middleware --update-env`.

2. Force one run to confirm:
   ```bash
   curl -X POST http://127.0.0.1:3002/sync/run \
     -H 'content-type: application/json' \
     -H 'x-shared-secret: bf4a75740a9b2655be4bd2bc08745c4a' \
     -d '{"endpoint":"Sales_Reports_KPI"}'
   ```
   Then open SAP API Settings, Scheduler tab: "Last run" and history should populate.

## Notes

- `deploy/enable-scheduler.sh` (also on the server now) runs the install + restart + status check for you.
- The scheduler reads cron, enable/active flags, date ranges and SAP system settings from the database every minute, so changes in the SAP API Settings screen apply without a restart.
- Cron times match the server clock; if you want IST schedules, check `timedatectl` on the box.
- The shared secret you pasted in chat is now exposed. I recommend rotating it: generate a new value, put it in the Quality `.env` (`MIDDLEWARE_SHARED_SECRET`), update the same value in the portal settings, and restart PM2. Tell me if you want me to generate one.
- For Production later, repeat the same steps under `/opt/MIS_Projects/Production/middleware` with PM2 process `mis-p-middleware` and port `3010`.
