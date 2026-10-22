# SIT From date: today's date on schedule, your chosen date otherwise

## Behavior
- **Scheduled sync (05:30 IST daily):** always sends **today's date** as the From date (FKDAT_F), so it moves forward by itself every day.
- **When you pick a date** in SAP API Settings and click Save, Test or Sync: the request sends that date exactly as you picked it.
- **New or empty From date:** the date picker starts on today's date.
- **To date (FKDAT_T):** no change. It's still optional and left out when empty.
- Order Book, Open Sales Orders and the other endpoints keep their current date behavior.

## Technical details
- `withSitDates(raw, range, now, scheduled)`: when `scheduled` is true, FKDAT_F = today's local date in `YYYYMMDD` format. Otherwise the saved valid date is kept, and a missing or invalid one falls back to today. Pass `scheduled` through `withEndpointDates`.
- Mirror the same change in `middleware/sync-core.mjs` (rebuild from `src/middleware` entry) so the scheduler sends today's date.
- Tests in `tests/sit.test.ts`: a scheduled run on 22-10-2026 sends `20261022`; a manual run keeps the saved `20260101`; an empty From date falls back to today.
- Quality/Production: copy the updated middleware and restart it.
