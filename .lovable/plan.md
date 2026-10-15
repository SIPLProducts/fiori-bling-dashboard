# Show Order No count on Total Open Orders tile

## Current behavior
- The **Total Open Orders** tile on the Open Sales Orders Reports screen shows the count of filtered **line items** (`filteredData.length`). This stays correct and unchanged.
- There is no display of how many distinct **Sales Order numbers** those line items belong to.

## Changes
- Add a pure helper `countDistinctOrders(rows)` in `src/lib/open-sales-orders-table.ts` that counts unique Sales Order numbers (`order`) in the given rows.
- On the **Total Open Orders** tile, keep the large line-items count and add a small secondary line beneath it showing the distinct order count, e.g. **"859 Lines · 358 Orders"** style: primary value stays the line count, with a muted "X Orders" subtitle underneath (label wording: "Order No").
- The distinct count follows the active Smart Filters, date range, and status selection, same as the line count.
- The tile is part of the PDF summary row, so the order count appears in the exported PDF automatically.
- No changes to other tiles, charts, table, Excel, launchpad, or calculations.

## Technical details
- Compute the distinct count inside the existing `metrics` useMemo as `countDistinctOrders(filteredData)`.
- Extend `SummaryCard` with an optional `subValue` prop (small muted text) so only this tile changes; other tiles pass nothing.
- Add a focused test in `tests/` asserting the helper counts unique orders and handles repeated items and empty input.

## Verification
- Open the screen and confirm the tile shows both counts; cross-check the distinct count against a database-side `COUNT(DISTINCT sales_order)` on active rows for the same filter selection.
- Apply a filter (e.g. status or customer) and confirm both counts update.
- Generate the PDF and confirm the tile shows both counts.
- Run existing tests plus the new one and check preview health.
