# "All" means only the user's assigned values on each screen

## Rule
On each screen, the filters that screen has decide what "All" covers for a restricted user:
- **Net Sales** (Profit Centre filter): "All" covers only the user's assigned profit centres. Plant 1100/1200 rows with other profit centres (e.g. PGNLB11001) are left out.
- **Open Sales Orders** (Plant filter): "All" covers only the user's assigned plants.
- **Cash Flow** (Plant and Profit Centre filters): a record must match an assigned plant **and** an assigned profit centre. A list with nothing assigned allows any value.
- A list with nothing assigned (or an Admin/Super Admin user) is not restricted, so behaviour stays as today.
- Totals, charts, tables, Excel and PDF all follow, because they share the same scoped data.

Example, Ram Koti: Net Sales shows only COFF100001 and COFF100004. Open Sales Orders shows only plants 1100 and 1200.

## Not changing
- The database access rule stays plant OR profit centre. This change only narrows what each screen shows.
- The Launchpad cards keep their current totals. They can be aligned later if you want.

## Technical details
- Add a pure helper `scopeRowsToAssigned(rows, access, { plant?, profitCentre? })` to `src/lib/user-access.ts`. It keeps a row when every key it's given matches its assigned list; an empty list or an unrestricted user passes the row.
- Net Sales (`sd-live-dashboard.tsx`): scope `all` by profit centre before the filters, options and analytics.
- Open Sales Orders: scope `data` by plant before options/filtering.
- Cash Flow: scope `all` by both.
- Tests: Ram Koti cases for each screen's rule, plus empty-list and admin pass-through.
- No database or deploy script changes. Quality/Production only need a frontend rebuild.
