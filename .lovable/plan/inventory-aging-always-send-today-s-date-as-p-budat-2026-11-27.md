# Inventory Aging: always send today's date as P_BUDAT

## What changes
- Every Inventory Aging sync sends today's date (India time) as P_BUDAT, for example "20261127" on 27-11-2026. That covers Sync button clicks, test requests and scheduled runs.
- Any old date saved in SAP API Settings is ignored. Everything else in the request body stays exactly as in your example: empty ranges, and buckets "0090", "0180" and "0365".

## Technical details
- `withSoAgeingDate` in `src/lib/so-ageing-map.ts`: always set `P_BUDAT = today (IST)`, whatever the saved value or `scheduled` flag.
- Mirror the change in `middleware/sync-core.mjs` (rebuild).
- Update the so-ageing test: a manual request with an old saved date still sends today's date.
- Update the AGENTS.md rule: P_BUDAT is always today (IST).
- Self-hosted: copy `sync-core.mjs`, then run `pm2 restart MIS_QTY`.
