# Multi-select Plant & Profit Centre access

## Rules (confirmed)
- A user can be given several Plants and several Profit Centres.
- No Plants assigned = all plants allowed; same for Profit Centres.
- A record shows only if its Plant AND its Profit Centre are both allowed.
- Admin / Super Admin always see everything.
- The database itself enforces this, so it can't be bypassed.

## 1. User Management popup
- Plant and Profit Centre become searchable multi-select dropdowns (code — name), with selected items shown as chips.
- Edit mode pre-selects saved values; items can be added or removed.
- User list shows the assigned plants/profit centres (shortened with a "+N" count).
- Existing single values carry over automatically.

## 2. Screens (all current ones)
- Sales Analytics / Net Sales, Open Sales Orders, Cash Flow, Launchpad cards, Management dashboard: data loads only for allowed plants/profit centres.
- Smart Filter Plant and Profit Centre lists show only the user's allowed values.
- Totals, charts, tables, Excel and PDF all follow automatically since they use the same data.
- TBN / ZTBN: rows are GL accounts with one column pair per profit centre; restricted users see only their allowed profit-centre columns (plant doesn't apply there).

## 3. Quality & Production
- One deploy script under deploy/user-access/ with the new columns, carry-over, access rules and schema reload; plus a matching migration file.

## Technical details
- profiles: add `plants text[] default '{}'`, `profit_centers text[] default '{}'`; backfill from existing `plant` / `profit_center`; mark old columns deprecated (keep writing first value for compatibility).
- SQL helper `public.user_can_see(_plant text, _pc text)` (security definer, stable): true if super admin/admin, else checks arrays (empty = unrestricted).
- Replace SELECT policies on zfisales_detail (plant, profit_ctr), open_sales_orders (plant, profit_center), zcash_flow (plant, profit_center) with `user_can_see(...)`. Update `net_sales_summary` (security definer) to apply the same check.
- ZTBN: server-side/column filtering of profit-centre columns using the user's profit_centers.
- `src/lib/user-access.ts` + query hook loading current user's allowed lists; filter option helpers intersect with them; include user id in report query keys so cached data doesn't leak across sign-ins.
- admin.functions.ts: create/update accept arrays.
- Tests: helper rules (empty = all, both must match, admin bypass) and option filtering.
- Middleware sync unaffected (service role bypasses policies).
