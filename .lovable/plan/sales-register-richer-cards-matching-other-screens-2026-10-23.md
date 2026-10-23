# Sales Register: richer cards matching other screens

## What changes
1. **Sales by Plant (Top 10)** — same plant chart style used on Order Book / SIT (plant code + name, radiant bars, value labels in ₹ Cr).
2. **Sales by Main Group** — stacked bars split by Division, same as SIT by Main Group (division legend, tooltip with each division's value and total).
3. **New card: Sales by Sub Group** — stacked by Division, same as Order Book / SIT Sub Group card; placed next to Main Group.
4. **Distribution Channel donut** — fix overlapping centre text: smaller total inside the ring, legend moved beside/below with wrapping, percentages not clashing with the ring.
5. **Sales by Product Category** — limited to Top 10.
6. **Radiant colours** on all cards (bars, donut slices, tax/daily charts) using the shared gradient palette used on other screens, for a consistent look.
7. Layout stays one-screen: row 1 tiles; row 2 Plant, Top 10 Customers, Main Group, Sub Group; row 3 Distribution Channel, Daily, Tax, Product Category.

## Technical
- `sales-register.ts`: add `byMainGroupDivision` / `bySubGroupDivision` (group → division → value) and `byCategory.slice(0,10)`; keep plant code + name (NAME1_P) on the row.
- `sales-register-dashboard.tsx`: reuse `OrderBookSubGroupChart` (with `groupLabel`) for Main/Sub Group; reuse shared chart gradients from `chart-colors.ts` via `<defs><linearGradient>` for bars and pie cells; donut centre text sized to ring.
- Tests: Top 10 category limit and division stacking totals.
