# Order Book: rename screen and round off tiles

Order Book screen and its PDF only. Open Sales Orders stays unchanged.

## Rename
- "Order Book Report" becomes **Order Book** in the page header, browser tab title, PDF title and PDF/Excel file names.
- "Order Book Report – Detailed View" becomes **Order Book – Detailed View**.

## Round off the four tiles to whole numbers
- Total Orders: e.g. 9,755. Already a whole count, so it stays the same.
- Order Value: ₹263.92 Cr becomes **₹264 Cr**
- Total LAH: 1,041.40 becomes **1,041**. This replaces the current .49 rule on the tile.
- Highest Value: ₹12.48 Cr becomes **₹12 Cr**
- Charts, tooltips, the detailed table and Excel keep their current decimals.

## Technical details
- In `open-sales-orders-dashboard.tsx`, set `screenTitle` and the detailed-view heading on `isBook`. Update the route head and ShellBar title in `order-book.tsx`.
- Add a pure `formatCrWhole` helper (₹ + Indian grouping, 0 decimals + " Cr") and a whole-number LAH formatter (value / 100000, rounded). Use both only in the Order Book SummaryCards.
- Add tests for the rounding (263.92 → ₹264 Cr, 104,140,000 AH → 1,041). Update the existing `formatBookLah` test only if that helper changes.
