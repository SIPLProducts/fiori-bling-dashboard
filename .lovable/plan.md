# Sales_Reports_KPI → zfisales_detail, synced every 10 minutes

Two things: (1) find out why the published site at mis.siplproducts.com cannot reach the middleware while the Lovable preview can, and (2) store every SAP row this API returns into the `zfisales_detail` table, refreshed automatically every 10 minutes, updating existing records instead of duplicating them.

## 1. Published site cannot reach the middleware

Confirmed facts:
- Middleware URL saved in settings: the ngrok address `https://donation-pantyhose-starter.ngrok-free.dev`, mode "proxy".
- The endpoint `Sales_Reports_KPI` exists, is active, scheduler flag on with `*/10 * * * *`, but `zfisales_detail` has 0 rows and there are no sync-run records at all — so no scheduled sync has ever executed.
- Preview shows "Middleware reached — SAP returned 200"; the published site shows "Not Found — the portal server could not reach the middleware".

The cause of the published-only failure is not yet proven. The two realistic candidates are: the published deployment is older than the current shared-secret middleware code (so the server call it makes does not exist there), or the shared-secret/middleware settings differ for the published environment. Step one is therefore to verify, not guess:

1. Republish the app and retry Test on the published site.
2. If it still fails, capture the exact failure from the published server logs and the middleware's own request log to see whether the request arrives at ngrok at all.
3. Fix based on what that shows, and report the confirmed cause.

Also note: ngrok free URLs change on restart. Whatever the outcome, the middleware address needs to be stable for scheduled syncing to keep working.

## 2. Store the API response in `zfisales_detail`

The existing table already matches this report. The current field mapper is aligned to a different field naming, so it will be corrected against the real response you pasted:

- Sales type from `SALE` (e.g. "Exports")
- Profit centre name from `LTEXT`
- GL name from `TXT50`, GL from `HKONT`
- Customer `KUNNR` / `NAME1`, material `MATNR` / `MAKTX`
- Dates `BLDAT` / `BUDAT` (already `YYYY-MM-DD`), month from `MONTH`
- Amount `DMBTR`, segment `SEGMENT`, plant `WERKS`, order `AUBEL` / `AUPOS`
- Everything else in the row (quantities, DMBTR_* buckets, country, model, division, etc.) is kept as-is in the `raw` JSON column, so nothing is lost

Duplicate rule (as you asked): the unique key is plant + fiscal year + document number + line item + GL account (`WERKS|GJAHR|BELNR|POSNR|HKONT`). If a record with that key already exists it is updated in place; if not, it is inserted. Nothing is duplicated.

Note on your sample: rows 1 and 4 share the same document and item but a different GL account, and they stay separate rows — correct, because they are separate posting lines.

## 3. Automatic 10-minute sync

- A server-side sync job calls the middleware with the saved endpoint (posting-date range from the endpoint payload), maps the rows and upserts them into `zfisales_detail`.
- Each run writes a log entry (received / inserted / updated / status / error) so the SAP API screen and Table Master show real "last synced" values instead of "Never synced".
- A schedule fires that job every 10 minutes against the published site's stable URL. It is skipped when a run is already in progress, and it stops itself after repeated failures until the next successful manual test, so a dead middleware does not generate an endless error loop.
- The job runs on the published environment, so it only starts producing data once item 1 is resolved.

## 4. UI

Sales Analytics / Sales Reports KPI already read from `zfisales_detail`, so once rows land they appear automatically. The header keeps showing source and last sync time.

## Technical notes

- Correct `src/lib/zfisales-sync.server.ts` field pickers (`SALE`, `LTEXT`, `MONTH`, numeric `GJAHR`/`POSNR` coerced to text) and reuse it for both the manual fetch and the scheduled job.
- Manual "Test/Fetch" on the SAP API screen also upserts and reports received / inserted / updated counts.
- New route `src/routes/api/public/sap/pull/zfisales.ts` (token-protected) performs the pull; pg_cron calls it every 10 minutes at `project--27aeaa58-eb6a-4965-897d-c1097d9ba383.lovable.app`.
- Upsert via `on conflict (record_key)` in batches of 500; run bookkeeping in `sap_sync_runs`.
- No schema change is needed for `zfisales_detail`; a small lock/state row is added for the single-flight guard.
