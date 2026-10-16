# Plant / Profit Centre: Select All + "plant OR profit centre" access

## Why 51270 saw 0
User 51270 has plants 1000, 1100 and 1110, and profit centres COFF100001–COFF100005. Under the old rule, a record had to match both a plant and a profit centre. Plant 1100 rows use only PGNLB/PGPED profit centres, so no record matched both lists.

## New rule (as requested)
- A record shows when its plant is assigned **or** its profit centre is assigned.
- If only plants are assigned, the user sees those plants. If only profit centres are assigned, the user sees those profit centres.
- If nothing is assigned, the user sees everything. Admin and Super Admin always see everything.
- This applies to every screen: Net Sales, Open Sales Orders, Cash Flow, Launchpad cards, Management and TBN. It also covers totals, charts, tables, Excel and PDF.
- After the change, 51270 will see all plant 1100 data, plus any COFF profit centre rows.

## Changes
1. In Create / Edit User, add **Select All** and **Deselect All** to the Plant and Profit Centre lists.
2. Add a short hint under the lists: "Records matching any selected plant or profit centre are shown. Leave both empty to allow all."
3. Change the database access check, which every screen uses, to the OR rule.
4. Smart Filter lists: show only the plants and profit centres that actually occur in the user's visible data, so no extra filtering hides them.

## Technical
- Migration: replace `public.user_can_see` so it returns true when the user is a data admin, or both arrays are empty, or the plant is in plants, or the profit centre is in profit_centers. Mirror the migration in `supabase/migrations/` and update `deploy/user-access/install-user-access.sql`, then run NOTIFY pgrst.
- Update `canSee` in `src/lib/user-access.ts` to the same rule. For TBN, profit-centre columns stay limited to assigned profit centres; if only plants are assigned, all columns stay visible.
- In `users.tsx`, pass `bulkActions` to both MultiSelects and add the hint.
- Update tests: OR match, plants-only, PCs-only, both empty = all, admin bypass.
