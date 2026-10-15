# Total Open Orders tile: show order numbers only

## What changes

The "Total Open Orders" card on the Open Sales Orders Reports screen will show the count of distinct sales order numbers as its main number, and the line-item count will no longer be displayed.

Before:
```text
Total Open Orders
40                <- line items
12 Order No       <- order numbers
```

After:
```text
Total Open Orders
12                <- order numbers
```

- The card keeps its name "Total Open Orders", icon, colour and position.
- The number still follows the Smart Filters (Plant, Sales Zone, Customer, Products, Division, date range, single/from-to mode) exactly as it does now — it is simply the order-number count instead of the line-item count.
- The card also appears in the PDF, so the PDF will show the same order-number count.
- Nothing else changes: Open Order Value, Pending Orders Against AH, the donut "Total Orders" centre figure, charts, rankings, detailed table, Excel download and pagination keep their current behaviour.

## Technical details

- `src/components/open-sales-orders-dashboard.tsx` line 364: the `SummaryCard` for "Total Open Orders" currently passes `value={formatNumber(filteredData.length)}` (line items) and `subValue={`${formatNumber(metrics.distinctOrders)} Order No`}`. It will pass `value={formatNumber(metrics.distinctOrders)}` and drop `subValue`.
- `countDistinctOrders` in `src/lib/open-sales-orders-table.ts` and the `distinctOrders` entry in the metrics memo stay as they are; the existing test in `tests/open-sales-orders-distinct-orders.test.ts` still covers the counting rule (repeated line items of one order count once, empty rows give zero).
- `subValue` remains an optional prop on `SummaryCard`, so the other cards are untouched.
- Verification: run the test suite, check the build log, and confirm in the preview that the tile shows the order-number count, that it changes when a filter is applied, and that the downloaded PDF shows the same figure.
