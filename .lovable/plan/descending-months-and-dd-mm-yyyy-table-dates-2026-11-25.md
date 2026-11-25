# Descending months and dd-mm-yyyy table dates

## Daily Production Report
- Month dropdown lists latest month first (Year is already latest first).
- Table stays newest Posting Date first, shown as dd-mm-yyyy (already the case).

## Purchase Orders List
- Table already shows newest PO Date first and dates as dd-mm-yyyy — no change needed.

## Open Sales Orders (and screens sharing its table: Order Book, Sales In Transit)
- Table is already newest first; change date display from dd.mm.yyyy to **dd-mm-yyyy** on screen and in Excel.

## Technical details
- `src/lib/daily-production-filters.ts`: months `.sort().reverse()`; update its test.
- `src/lib/open-sales-orders-table.ts`: `displayOpenOrderDate` format `dd-MM-yyyy`; add a small test.
