# MIS reports: SAP → Database → UI

Goal: every report gets its own database table that SAP fills every 5 minutes, and the UI reads from that table instead of sample data. First report: Sales Analytics KPI (`ZFISALES`).

## 1. New table: `zfisales_detail`

One row per FI/SD sales line, keyed so repeat syncs update instead of duplicate.

- Business key `record_key` = `WERKS + GJAHR + BELNR + POSNR + HKONT` (unique)
- Report fields: GL account + name, profit centre + name, group, sales type, company code + name, customer + name, fiscal year, document no, document date, posting date, period/month, reference, document type, posting key, amount, segment, plant, sales order + item, material
- Raw SAP payload kept as JSON for anything not yet mapped
- Sync bookkeeping: `synced_at`, `source_endpoint`

Access rules:
- Signed-in portal users can read the data
- Only the sync service (server side) can insert or update — no browser writes
- No public/anonymous access

## 2. New table: `sap_sync_runs`

One row per sync attempt so you can see freshness and volumes:
endpoint name, started/finished time, status, records received, inserted, updated, error message.

Signed-in users can read it; only the sync service writes.

## 3. Ingestion endpoint (SAP pushes every 5 min)

A public HTTP endpoint `POST /api/public/sap/sync/zfisales` that:
- Requires a shared secret header (`X-Sync-Token`) — rejects anything else
- Accepts the SAP response payload as-is (array or `{ d: { results } }` wrapper)
- Maps and validates rows, computes `record_key`
- Upserts in batches: existing keys updated, new keys inserted, `synced_at` refreshed
- Writes a `sap_sync_runs` row with counts and returns `{ received, inserted, updated }`

This works both for SAP/middleware pushing directly and for a scheduled pull from the middleware.

## 4. UI switches to the table

- `zfisales.functions.ts` reads from `zfisales_detail` (filtered by posting date, fiscal year, company code, profit centre, sales type, segment) instead of the hard-coded `SALES_ROWS`
- Sample data stays as a fallback only when the table is empty, so nothing breaks before the first sync
- Sales Analytics header shows "Source: ZFISALES_DETAIL · last synced <time>" from the latest sync run

## 5. Repeatable pattern for other modules

Each future report follows the same three pieces: `<report>_detail` table + entry in `sap_sync_runs` + one ingestion route path. Later reports (Finance & GST, Sales Register, MM/FI/CO modules) reuse this shape.

## Technical notes

- Table/index: unique index on `record_key`, plus indexes on `posting_date`, `fiscal_year`, `company_code`, `profit_ctr` for filter performance
- Upsert via `on conflict (record_key) do update`
- Sync token stored as a backend secret, added during implementation
- Amount stored as `numeric(18,2)`; dates as `date`
