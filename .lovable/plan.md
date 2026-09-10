# Getting the middleware scheduler running on Quality

## What we know now

- The new files did reach the server: the latest PM2 error is `Cannot find package '@supabase/supabase-js' imported from .../scheduler.mjs` — that file only exists in the new build.
- The crash is just missing npm dependencies. `package.json` now lists `@supabase/supabase-js` and `esbuild`, but `npm install` has not been run on the server since the files were copied.

## Immediate diagnosis and fix

The old successful SAP lines remain in the PM2 log and do not prove the restarted process works. The repeated error means the package is still absent in the exact folder PM2 starts from. Run this whole block:

```bash
cd /opt/MIS_Projects/Quality/middleware

pwd
grep -n '"@supabase/supabase-js"' package.json
npm install @supabase/supabase-js@^2.58.0
npm ls @supabase/supabase-js
node -e "import('@supabase/supabase-js').then(()=>console.log('Supabase module OK')).catch(e=>{console.error(e);process.exit(1)})"
pm2 describe mis-q-middleware | grep -E 'script path|exec cwd|status'
```

Before restarting, confirm:

- `package.json` prints the dependency.
- `npm ls` prints an installed version, not `(empty)`.
- Node prints `Supabase module OK`.
- PM2 `exec cwd` is `/opt/MIS_Projects/Quality/middleware`.

If `grep` prints nothing, the server still has the old `package.json`; copy/pull the updated file and rerun the block. If PM2 shows another working folder, recreate it from the correct folder:

```bash
pm2 delete mis-q-middleware
cd /opt/MIS_Projects/Quality/middleware
pm2 start server.mjs --name mis-q-middleware --cwd /opt/MIS_Projects/Quality/middleware
pm2 save
```

Once the module test passes and PM2 points to the correct folder:

```bash
pm2 restart mis-q-middleware --update-env
pm2 flush
pm2 logs mis-q-middleware --lines 50
```

Expect fresh `listening on :3002` and `scheduler started` lines.

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
