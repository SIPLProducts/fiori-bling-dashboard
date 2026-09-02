# SD dashboard: rename, trim tiles, show bar values

## Changes

1. **Rename the page** — header reads "Sales report KPI (ZFISALES_MIS)" instead of "SD — Sales & Distribution". The launchpad tile/description text "Sales order intake, billing, backorders and delivery performance." is removed.
2. **Remove two KPI tiles** — "Documents" and "Avg realization / unit". The remaining tiles (Total revenue, Customers, Avg order value, Month-on-month, Top profit centre) reflow to fill the grid.
3. **Quantity values on the bars** — in "Volume & average realization by month", the quantity value is printed above each bar (compact format, e.g. 5.07 L) so it is readable without hovering. Tooltip stays as is.

## Technical notes

- `src/lib/sap-modules.ts`: SD module `title`/`groupTitle` become "Sales report KPI (ZFISALES_MIS)"; `description` cleared of the sales-order-intake wording.
- `src/components/sd-live-dashboard.tsx`: delete the two `KpiCard` blocks; add `<LabelList dataKey="quantity" position="top" formatter={compact} />` inside the quantity `<Bar>` with a small top margin so labels are not clipped.
- No data, schema, or filter changes.
