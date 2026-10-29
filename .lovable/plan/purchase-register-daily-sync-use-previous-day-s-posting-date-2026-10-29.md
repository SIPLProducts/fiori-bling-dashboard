# Purchase Register daily sync: use previous day's posting date

## Goal
In SAP API Settings, add a "Previous date" choice to the posting date range. When chosen, every daily sync sends yesterday as both Posting From and Posting To (BUDAT_F = BUDAT_T = yesterday, IST), recomputed on each run.

## Changes
1. **New range option "Previous date"** in the posting-range dropdown (next to "Current date"). Selecting it fills both date pickers with yesterday's date as a preview.
2. **Daily/scheduled and manual sync** with this option always send yesterday → yesterday, so the 15:00 run on 29-10 pulls 28-10 postings.
3. Set the Purchase Register endpoint to "Previous date" after the change (you can also pick it yourself in the dropdown and Save).

## Technical details
- `src/lib/sap-pull-shared.ts`: add `"yesterday"` to `PostingRange` and `POSTING_RANGES` (label "Previous date"); in `postingWindow` set both `from` and `to` to now − 1 day. `withPostingDates` already uses the window, so scheduler and manual pulls follow automatically. Other screens sharing `postingWindow` (Order Book, SIT) gain the option too without behaviour change.
- Migration (Cloud + mirrored file in `supabase/migrations`): replace `sap_endpoints_posting_range_check` to allow `today, yesterday, last7d, last1m, last6m, last1y, fytd, custom`.
- Rebuild `middleware/sync-core.mjs` (`bun run build:sync-core`) so Quality/Production schedulers use the new option; redeploy + `pm2 restart` on servers.
- Add a unit test: `postingWindow("yesterday", 2026-10-29)` returns `{from: "20261028", to: "20261028"}`.
