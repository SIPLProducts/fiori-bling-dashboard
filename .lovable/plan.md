# Fix: middleware scheduler crashes on Node.js 20 (WebSocket error)

## Problem

The Quality middleware crashes at startup with:

```text
Error: Node.js 20 detected without native WebSocket support.
at createScheduler (scheduler.mjs:78)
```

The Supabase client tries to start a Realtime WebSocket connection, but Node.js 20 has no built-in WebSocket. The scheduler only needs database reads/writes — it never uses Realtime — so the WebSocket requirement is unnecessary but currently fatal.

## Fix (I will commit and push to git)

1. **Add the `ws` package** to `middleware/package.json` dependencies (it provides WebSocket for Node < 22).
2. **Update `middleware/scheduler.mjs`** to pass `ws` as the Realtime transport in the Supabase client options at lines 77–79:
   ```js
   import WebSocket from "ws";
   // ...
   const db = enabled
     ? createClient(url, key, {
         auth: { persistSession: false, autoRefreshToken: false },
         realtime: { transport: WebSocket },
       })
     : null;
   ```
3. Run `npm install` locally, verify `node --check middleware/scheduler.mjs`, and confirm the middleware starts cleanly.
4. Commit and push to `main`.

## What you run on the Quality server (after I push)

```bash
cd /opt/MIS_Projects/Quality
git pull
cd middleware
npm install
pm2 restart mis-q-middleware --update-env
pm2 logs mis-q-middleware --lines 30
```

Expected in the logs: `listening on :3002` and `scheduler started` — no more WebSocket error.

Then force one test sync:

```bash
curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H "x-shared-secret: <your shared secret>" \
  -d '{"endpoint":"Sales_Reports_KPI"}'
```

Check SAP API Settings → Scheduler: Last run, record counts, and history should now populate, and the `*/5 * * * *` schedule will run automatically every 5 minutes.

## Notes

- No change to Nginx, the portal frontend, or database.
- `.env` stays as-is (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must remain set from the earlier step).
