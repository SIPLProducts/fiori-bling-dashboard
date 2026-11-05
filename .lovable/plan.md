# Fix "Purchase Register: statement timeout"

## Why it happens
The screen loads a whole financial year (tens of thousands of lines) in pages of 1,000, 8 pages at a time, using "skip N rows" paging. For later pages the database must re-read and throw away every earlier row (page 80 reads 80,000 rows to return 1,000). Plus a full "exact count" runs first, and the permission check runs on every row. With 8 such heavy requests in parallel on ~90k lines, some exceed the database time limit and the screen fails.

## Fix
1. **Keyset paging** in `getPurchaseRows`: fetch the next 1,000 rows "after the last (date, id) seen" using the existing `(budat, id)` index, so each page costs the same regardless of depth. To keep parallelism, split the FY into 12 monthly windows and page each month by keyset (4–6 months concurrently).
2. **Drop the exact count** request (no longer needed).
3. **Faster permission check**: rewrite the purchase_register read policy so the permission function is evaluated once per query (`(select fn(...))` form) instead of per row; mirror as a timestamped migration in `supabase/migrations` for Quality/Production.
4. Bump the query key so old cached results don't survive.
5. Verify: run EXPLAIN on a deep page before/after in the preview database; confirm screen loads.

## Deploy note
Quality/Production need the new migration and the frontend build; no middleware change.
