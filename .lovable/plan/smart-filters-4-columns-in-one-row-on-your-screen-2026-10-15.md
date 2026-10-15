# Smart Filters: 4 columns in one row on your screen

## Cause (verified)
- The Open Sales Orders Smart Filters card switches to 4 columns only at 900px width or wider.
- Your current preview window is 889px, so it falls back to 2 columns — that is why you see two per row.

## Changes
- Lower the 4-column breakpoint from 900px to 860px, so your 889px window (and similar desktop widths) shows all 8 filter controls as 4 columns × 2 rows:
  - Row 1: Plant · Distribution Channel · Sales Document Type · Date Range
  - Row 2: Customer · Sales Zone · Products · Division
- Keep the existing behavior below 860px: 2 columns on tablets, 1 column on narrow phones.
- No changes to filters, selections, Reset, date modes, data, charts, table, Excel, or PDF.

## Files
- `src/components/open-sales-orders-dashboard.tsx` — change `min-[900px]:grid-cols-4` to `min-[860px]:grid-cols-4` on the Smart Filters grid.
- `src/styles.css` — change the `.orders-compact [data-order-filters]` media query from `min-width: 900px` to `min-width: 860px`.

## Validation
- Screenshot at 889px width: confirm 4 columns per row, readable labels, no overflow or clipped dropdowns/date buttons.
- Spot-check at 700px (2 columns) and 375px (1 column) to confirm smaller screens are unchanged.
- Run tests and confirm a clean build.
