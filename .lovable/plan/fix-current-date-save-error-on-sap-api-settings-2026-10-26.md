# Fix "Current date" save error on SAP API Settings

## Why the error happens
The screen offers a new date-window choice, **Current date** (stored as `today`). The database still has an old rule (`sap_endpoints_posting_range_check`) that only accepts `last7d`, `last1m`, `last6m`, `last1y` and `custom`. So saving `today` is refused.

## Fix
1. Migration: drop and recreate the rule to also allow `today`.
2. Save the same SQL as `deploy/sit/allow-current-date-window.sql` (safe to rerun) for Quality and Production.
3. Check the server-side save validation accepts `today` (fix if it lists only the old values).
4. Update the morning-sync middleware (`middleware/sync-core.mjs` / `sync-core.entry.ts`) so `today` sends FKDAT_F = run date and omits FKDAT_T.
5. Add a test: `today` window gives from = today and no FKDAT_T. Then save Current date on SIT and confirm no error.

## Technical details
```sql
ALTER TABLE public.sap_endpoints DROP CONSTRAINT IF EXISTS sap_endpoints_posting_range_check;
ALTER TABLE public.sap_endpoints ADD CONSTRAINT sap_endpoints_posting_range_check
  CHECK (posting_range IN ('today','last7d','last1m','last6m','last1y','custom'));
```
