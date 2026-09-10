# Why the server never syncs on schedule, and how to fix it

## What is actually happening

On the Lovable-hosted site the scheduled sync works because two things exist there that do **not** exist on your server:

1. A background timer inside the hosted database that fires every 5 minutes.
2. An always-running portal server that receives that trigger, calls the middleware, and writes rows.

Your self-hosted deployment serves the portal as static files behind Nginx. There is no always-running portal process, so:

- the scheduled address the timer was set up to call (`.../api/public/sap/pull/zfisales`) does not exist on your server — it still points at the Lovable cloud address,
- data only ever moves when a person opens SAP API Settings and presses **Test**. That is exactly what you see: Test works, "Last run: never", no sync history.

Nothing is wrong with your middleware, SAP credentials, or the cron expression you saved.

## The fix

Give the server its own always-running scheduler by putting it inside the SAP middleware service (`mis-sap-middleware`), which already runs 24/7 under PM2 on the server and already reaches both SAP and the local database.

What gets built:

1. **Scheduler inside the middleware, fully dynamic.** Every minute it re-reads the saved endpoints from your local database and runs the ones that are due. Interval, on/off switch, endpoint path, method, request payload and dates, SAP system and client, and the active/inactive flag are all taken live from what is saved in the screens — nothing is fixed in code. Change anything in the UI and the next tick uses it; add a second endpoint later and it is scheduled automatically.
2. **Full sync in the middleware.** It calls SAP through the same path Test uses, maps the rows with the same logic the app uses today (shared code, not a second copy), and inserts new records / updates existing ones by the same record key. An empty SAP response never deletes anything.
3. **Run history written for every run**, so the Scheduler tab shows real "Last run", success/failure, and received / new / updated counts on the server just like your screenshot 4.
4. **Single-run guard** so a slow pull cannot overlap with the next tick.
5. **Manual trigger endpoint** on the middleware so you can force a run from the server for testing.
6. **Docs + deploy update**: the extra settings for `middleware/.env`, and the Nginx blocks stay unchanged.

## Config I will need from you (after approval)

For the middleware `.env` on the server:

- the local database API address the middleware should write to (the Kong/API gateway address, e.g. `http://127.0.0.1:8000`)
- the **service role key** of your self-hosted Quality instance (server-side only, never sent to the browser)

Everything else (SAP host, client, user, password, shared secret, port) is already in place.

## Technical notes

- New `middleware/scheduler.mjs`: one-minute tick, cron matching, per-endpoint due check, single-flight lock.
- New `middleware/sync-core.mjs` generated at install/build time by bundling `src/lib/zfisales-map.ts` and `src/lib/sap-pull-shared.ts` with esbuild, so mapping/salvage logic stays in one place.
- Writes via `@supabase/supabase-js` with the service role key: batched upsert on `record_key` into `zfisales_detail`, plus `sap_sync_runs` rows (received / inserted / updated / status / error / duration / bytes / http status).
- Reads `sap_endpoints`, `sap_systems`, `sap_middleware_config` from the local database; SAP credentials continue to come from the middleware's own `.env`.
- `apply_sap_sync_schedule` / pg_cron stay untouched — they remain the hosted path; the on-prem path no longer depends on them.
- Hosted (Lovable) behaviour is unchanged.
