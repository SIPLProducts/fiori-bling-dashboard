# Net Sales — renames, unit formatting, and hide-by-flag

All renames and hides apply to the Sales report KPI (ZFISALES_MIS) dashboard. "Hide" means the code stays intact behind a small visibility flag so it can be re-shown later with a one-word request.

## Changes

1. **Rename to "Net Sales"** — the module/screen title "Sales report KPI (ZFISALES_MIS)" becomes "Net Sales (ZFISALES_MIS)" in the header, launchpad tile, and navigation.
2. **Smart Filter card** — hide the Plant dropdown via a flag (code kept), and exclude the "1200" plant option from the dropdown list data.
3. **Amount units everywhere** — all amount displays on this screen use Indian units: crores shown as "Cr" (e.g. 396.86 Cr), lakhs as "L" (e.g. 5.07 L), and compact "K"/plain for smaller values. Applies to KPI tiles, chart labels, tooltips, bar lists, treemap amounts, and the document table amount column.
4. **Hide "Total Quantity" tile** — flag-wrapped, code preserved.
5. **Rename "Active Customers" → "Billed Customers".**
6. **Hide "Average Order Value" tile** — flag-wrapped, code preserved.
7. **Rename "Revenue Trend" card → "Sales Trend".**
8. **Hide "Top Profit Centre" tile** — flag-wrapped, code preserved; remaining KPI tiles reflow in the single row.

## Technical notes

- `src/lib/sap-modules.ts`: update the SD module `title`/heading text to "Net Sales (ZFISALES_MIS)".
- `src/components/sd-live-dashboard.tsx`:
  - Add a small `const HIDDEN_TILES = { quantity: true, avgOrderValue: true, topProfitCentre: true }` (or similar) block and wrap those `KpiCard`s in conditionals — nothing is deleted.
  - Wrap the Plant filter dropdown in a `SHOW_PLANT_FILTER` flag; filter out the "1200" option from the plant list.
  - Centralize an `inrCompact()` formatter (Cr/L/K) and use it consistently for tiles, charts, tooltips, bar lists, treemap, and the table amount column.
  - Rename KPI/card labels: "Active Customers" → "Billed Customers", "Revenue Trend" → "Sales Trend".
- No data, schema, filter-logic, or permission changes.
