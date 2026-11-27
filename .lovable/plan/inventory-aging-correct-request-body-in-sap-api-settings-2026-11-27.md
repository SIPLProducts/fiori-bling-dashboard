# Inventory Aging: correct request body in SAP API Settings

## What changes
- **SAP API Settings, Inventory Aging, Request tab:** the "Posting date range", "Posting From Date" and "Posting To Date" fields are removed. In their place, a note says "P_BUDAT is sent as today's date (YYYYMMDD) on every sync".
- **No BUDAT_F / BUDAT_T:** the screen stops adding these keys to the saved payload, and removes them from any payload already saved. They are never sent.
- **Exact body sent:** every sync and test request sends:
  - P_BUDAT as today's date.
  - Every _FROM/_TO range as `[]` when empty. Today they show as `""`.
  - Buckets "0090", "0180" and "0365".
  This matches your payload exactly.
- **Default payload:** the Request payload box shows your correct payload as the default.

## Technical details
- `src/routes/_authenticated/admin/sap-api.tsx`:
  - Add an `isAgeing` flag using `isSoAgeingEndpoint`.
  - Skip the posting-range UI and BUDAT backfill/sync when the flag is set, and strip BUDAT_F/BUDAT_T from the payload when saving.
- `withSoAgeingDate` in `src/lib/so-ageing-map.ts`, mirrored in `middleware/sync-core.mjs`:
  - Convert `""`/null `*_FROM`/`*_TO` values to `[]`.
  - Keep the BUDAT deletion and the always-today P_BUDAT.
- Test: the output matches the user's payload for an input with `""` ranges and BUDAT keys.
- One migration updates the saved Inventory_Aging payload in `sap_endpoints` to the correct body. It's mirrored in supabase/migrations.
- Self-hosted: copy `sync-core.mjs`, run the migration, `pm2 restart MIS_QTY`, then redeploy the site.
