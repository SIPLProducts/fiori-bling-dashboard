# Add "Financial year to date" date window

## What changes
In SAP API Settings > Request > Date window, add a new option **Financial year to date**.
- From date = 1 April of the current financial year (IST). From 27.10.2026 this is 01.04.2026; from 01.04.2027 it switches to 01.04.2027 on its own.
- To date = today (IST), worked out again on every run.
- Picking it fills the two date fields in the request (fkdat_f/fkdat_t for Sales Register) straight away.
- The daily morning sync and manual Sync both work out the dates on the day they run, so the range moves forward every day.
- Works for any API that uses a date window (Sales Register, Net Sales, Purchase Register, and others), not just Sales Register.

## Technical details
- `src/lib/sap-pull-shared.ts`: add `"fytd"` to `PostingRange` and its options; window = FY start (April, IST) to today.
- `middleware/sync-core.mjs`: add the same `fytd` case so scheduled runs match.
- Migration plus `deploy/sit/allow-fytd-window.sql`: update the `sap_endpoints_posting_range_check` constraint to allow `'fytd'`. Mirror it in `supabase/migrations`.
- Test: on 27.10.2026 → 20260401–20261027; on 15.02.2027 → 20260401–20270215; on 01.04.2027 → 20270401–20270401.
- After deploy: choose "Financial year to date" for Sales Register and press Save.
