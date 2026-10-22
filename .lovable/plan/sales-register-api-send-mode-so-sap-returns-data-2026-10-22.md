# Sales Register API: send MODE so SAP returns data

## Problem
SAP replies "Please provide MODE as ONETIME or DAILY" because the saved Sales Register request has no MODE field, so no rows come back.

## Fix
- The daily scheduled sync sends `"MODE": "DAILY"`.
- A manual Test/Sync sends `"MODE": "ONETIME"` with the From/To billing dates you picked (fkdat_f / fkdat_t).
- If MODE is already typed in the request body, it is overwritten with the right value, so it can't be wrong.
- Only the Sales Register API is affected. Other APIs are unchanged.

## Next step (after you paste a sample response)
- Create a table to save every field from the response, plus the full original row.
- Fill the Sales Register screen, filters and "Data available" from that table.

## Technical details
- `src/lib/sap-pull-shared.ts`: in `withEndpointDates`, for endpoints whose path contains `zvf05_fin_n/finance`, set `MODE` to `scheduled ? "DAILY" : "ONETIME"`. Mirror the same change in `middleware/sync-core.mjs` (Quality/Production middleware must be updated and restarted).
- Tests in `tests/sap-endpoint-dates.test.ts`: scheduled → DAILY, manual → ONETIME with the saved dates kept.
