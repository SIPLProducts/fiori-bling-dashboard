# Fix "statement timeout" / 500 on Purchase Register (and same risk on other screens)

## Root cause (confirmed)
The permission rule on `purchase_register` calls `user_can_see(werks, prctr)` for **every row**. That function re-reads the user's profile and admin status each time, so a page of 1,000 rows at offset 8,000 runs ~9,000 permission lookups. With 8 pages loading in parallel the database hits its time limit and returns 500.
The same per-row rule is used by **Sales In Transit, Sales Register, Order Book, Open Purchase Orders and Purchase Orders** — they will fail the same way as data grows. Net Sales, Open Sales Orders and Cash Flow already use the fast form.

## Fix
1. **Fast permission rules** (one migration, same access result): rewrite the read rules on those 6 tables to the form Net Sales uses — check "unrestricted / my plants / my profit centers" once per query, then compare each row's plant/profit center in memory.
2. **Purchase Register paging**: replace "skip N rows" paging with month-by-month loading keyed on (date, id) using the existing index; drop the exact count request; bump the query key.
3. Mirror the migration in a timestamped `supabase/migrations` file for Quality/Production.
4. Verify with EXPLAIN on the failing request and by loading the screen.

## Deploy
Quality/Production: run the new migration + rebuild frontend. No middleware change.
