# Fix middleware access, then add a 10-minute SAP → database sync

## What your log actually shows

```text
[mis-sap-middleware] blocked origin: https://27aeaa58-...lovableproject.com
POST /sap/call  403 Forbidden
```

The middleware is running and reachable through ngrok. It is refusing the browser because of two config values:

1. `ALLOWED_ORIGINS=https://jnugfajppmbrlqrfeeav.supabase.co` — this is the backend address, not a browser origin. The list must contain the addresses the portal is **opened from**. Yours are:
   - `https://27aeaa58-eb6a-4965-897d-c1097d9ba383.lovableproject.com` (the one being blocked right now)
   - `https://id-preview--27aeaa58-eb6a-4965-897d-c1097d9ba383.lovable.app`
   - `https://fiori-bling-dashboard.lovable.app`
   - `https://mis.siplproducts.com`
2. `APP_BASE_URL` should be the middleware's own public address: `https://donation-pantyhose-starter.ngrok-free.dev`.

Fixing those clears the 403. The next wall is `SUPABASE_JWT_SECRET=123456`: portal sign-in tokens are not signed with that value, so every call would then fail token verification. On this platform the raw signing secret is not handed out, so the middleware should stop guessing it.

## Change 1 — verify portal tokens the supported way

Replace the shared-secret check in `middleware/server.mjs` with verification against the backend's public signing keys (JWKS), fetched once and cached. No secret to copy, works with the current token format. `SUPABASE_JWT_SECRET` is dropped from `.env.example` and the README; `SUPABASE_URL` (the project URL you already have) replaces it.

Also: allow-list handling gains a wildcard-friendly entry so any `*.lovableproject.com` / `*.lovable.app` preview origin can be permitted with one line instead of editing `.env` each time a preview URL changes.

## Change 2 — a machine caller for the scheduler

Scheduled runs have no signed-in user, so the middleware also accepts a second caller type: a request carrying a `X-Service-Token` header matching `SERVICE_TOKEN` in its `.env` (a long random value you generate). Only that header, or a valid portal token, gets through.

## Change 3 — store synced rows in the database

New table `sales_reports_kpi` holding:

- the SAP record's own fields (created from the sample response of the endpoint's last successful test, so columns match your real payload)
- `source_endpoint_id`, `record_key` (the unique business key), `payload` (full raw row as JSON)
- `synced_at` — the stored date/time, refreshed on every update
- `created_at` / `updated_at`

Uniqueness is on `record_key`: existing rows are updated in place, new rows inserted. Nothing is deleted.

A companion table `sap_sync_runs` records each run: endpoint, started/finished time, status, records received, inserted, updated, and the error text if it failed.

## Change 4 — the 10-minute job

- A public endpoint `/api/public/sap-sync` in the portal: authenticates the scheduler, reads the endpoint config from the database, calls the middleware with the saved method / path / headers / body (including the `BUDAT_F` / `BUDAT_T` posting-date window), then upserts every returned row.
- Scheduled every 10 minutes. It is bounded (one endpoint per run, capped batch), takes a lease so two runs never overlap, marks progress per record, and pauses itself after repeated failures instead of hammering SAP.
- The Scheduler tab shows real values instead of "never": last run time, status, and the counts (received / new / updated). A **Run now** button triggers one immediate sync.
- Your current cron text `10 * * * *` means "once an hour at minute 10". The field will accept `*/10 * * * *` and the UI will show a plain-language preview of the chosen schedule so this is not silent again.

## Change 5 — KPI screen reads the synced data

The Sales Reports KPI screen switches from the bundled sample dataset to `sales_reports_kpi`, with a "last synced" line in the header. If the table is empty it says so rather than showing stale demo numbers.

## What I need from you

The unique business key for a KPI record — the field(s) that identify one row so re-runs update rather than duplicate (for example billing document + item, or document + company code + posting date). If you paste one full sample response row from the endpoint's test, I will derive both the table columns and the key from it.

## Security note

The SAP password and the token value were pasted in chat again. Rotate the SAP user's password and keep the replacement only in the middleware server's `.env`, which is never committed.
