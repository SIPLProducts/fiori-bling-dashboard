# Order Book Smart Filters: second row with five filters

- Order Book screen only, on desktop widths (860px and wider):
  - Row 1: Plant · Distribution Channel · Sales Document Type · Date Range · Financial Year (unchanged order)
  - Row 2: **Quarter · Customer · Sales Zone · Products · Division**, all in one row, equal widths
- Open Sales Orders keeps its current 4-column layout.
- Tablet (2 columns) and phone (1 column) layouts stay as they are.
- No change to filter behaviour, data, charts, table, Excel or PDF.

## Technical details
- `src/components/open-sales-orders-dashboard.tsx`: when `isBook`, use a 5-column grid (`min-[860px]:grid-cols-5`) on the Smart Filters container; drop the `col-start-1` wrapper on Customer for Order Book so Quarter starts row 2.
- `src/styles.css`: add an Order Book override (e.g. `[data-order-filters][data-book]`) with `repeat(5, minmax(0, 1fr))` at 860px+ so the compact rule doesn't force 4 columns.
- Verify with a screenshot at 889px width that row 2 holds the five filters without clipping.
