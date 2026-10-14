# Cash Flow — Smart Filters card

## What changes

The Cash Flow screen gets the same Smart Filters card used on the other report screens (Open Sales Orders, Net Sales), replacing the current plain row of dropdowns.

### Card layout (same as other screens)
- Header row: filter icon + **Smart Filters** title, an **"N active"** badge when filters are set, a filtered/total record count, a **Reset** button, and a collapse/expand chevron.
- Filter fields in a 4-column grid on desktop (900px+), 2 columns on tablet, 1 column on phone.
- Collapsible body; excluded from the PDF export like on other screens.

### Filter fields
- Plant
- Profit Centre (PC)
- GL Code
- PC Group
- Classification
- Nature

All six become **multi-select dropdowns** with Select All / Deselect All, matching the other screens (today they are single-select). Options come from the loaded table data, sorted, with the existing friendly labels ("code — name" for Profit Centre and GL Code).

### Behaviour
- Selecting values filters the KPIs, charts, ledger, pagination and Excel download exactly as the current dropdowns do — only the control changes.
- **Reset** clears all filters and returns the ledger to page 1.
- Record counts ("X of Y records") update live.
- No change to data source, Refresh-on-click-only, charts, ledger, pagination, or Excel export.

## Technical details

- `src/lib/cash-flow.ts`: change `CashFilters` from `string` per key to `string[]` per key (default empty = no restriction, matching the `null`/`[]` convention used elsewhere); update `filterCashRows` to match against the selected arrays.
- `src/components/cash-flow-dashboard.tsx`: replace the plain `Select` row with the Smart Filters card shell (Filter icon header, active count, Reset, collapse state, `data-pdf-exclude`) reusing the existing `FilterMultiSelect` component used by Open Sales Orders; layout via the same 4-column grid classes.
- `src/components/cash-flow-charts.tsx` and launchpad card: no changes (they receive already-filtered rows).
- `tests/cash-flow.test.ts`: update filter tests for array-based selection (empty array = all; multiple values = union).
- Screen-only change — no database, migration, or sync impact.
