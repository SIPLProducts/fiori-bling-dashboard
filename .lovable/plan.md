# Net Sales — Top 10 row below the KPI tiles

Add a single row directly under the KPI tiles with four equal Top 10 cards: Profit Centres, Customers, Materials, and Sales Employees.

## Changes

1. **New "Top 10" row** — a 4-column grid (stacks on smaller screens) placed immediately after the KPI tile row, containing:
   - **Top 10 Profit Centres** — same bar-list style as the existing card, now showing 10.
   - **Top 10 Customers** — same single-line bar-list style, now showing 10.
   - **Top 10 Materials** — same ranked-list style, now showing 10.
   - **Top 10 Sales Employees** — new card, same bar-list style, ranked by total sales amount per employee, using the existing `sales_rep_name` (Sales employee) data.
2. **Remove the old placements** — the existing Top 5 Profit Centres / Top 5 Materials / Top customers cards are moved into this row as Top 10 (not duplicated). The panels they shared a row with (Sales by Main Group treemap, Sales by Segment donut) reflow to fill their rows cleanly.
3. Amounts keep the Cr / L / K compact formatting and single-line truncated names with hover tooltips, matching the current cards.

## Technical notes

- `src/lib/sd-live.ts`: add `topSalesEmployees` (top 10, aggregated by `salesRepName`) to `SdAnalytics`; raise `topProfitCentres` to 10 and `topMaterials` to 10 (customers already fetch 10).
- `src/components/sd-live-dashboard.tsx`: add the `lg:grid-cols-4` row after the KPI grid with the four Top 10 panels; remove the three cards from their current positions and let the treemap/segment rows reflow.
- No data, schema, or filter changes — `sales_rep_name` is already fetched.
