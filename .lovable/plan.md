# Move Main Group and Sub Group cards above the Customer card

## Goal
On the Open Sales Orders Reports screen, the two new cards **Open Orders by Main Group** and **Open Orders by Sub Group** should appear immediately before the ranking row that starts with **Top 10 Open Orders by Customer** — not directly under the summary tiles as they are now.

## Resulting order on screen
1. Smart Filters
2. Three summary tiles (Total Open Orders, Open Order Value, Pending Orders Against AH)
3. Sales Document Type · Aging Bucket · Value Trend · LD Status
4. Sales Zone and Plant-wise Pending
5. **Open Orders by Main Group · Open Orders by Sub Group** (new position)
6. Top 10 Open Orders by Customer · by Product · Model Wise
7. Status cards, Quick View, detailed table

## What changes
- The two-card block moves as it is — same titles, vertical bars, group names along the bottom, Value (₹ Cr) on the left, tooltips with Division(s), Open Orders and Open Value, same colors, same widths (two side by side on desktop, stacked on phones).
- Nothing else moves. Filters, tiles, all other charts, table, search, pagination, Refresh and PDF behaviour stay exactly as they are.
- PDF export follows the same new order, since the export reads the page in this sequence.

## Technical details
- `src/components/open-sales-orders-dashboard.tsx`: relocate the existing `order-group-row` block (the two `Panel` entries rendered with `OpenOrdersGroupChart`) from its current position after the summary row to directly before the `order-ranking-row` block. No data, aggregation, or chart code changes.
- `src/styles.css`: no new rules needed — `.order-group-row` has no position-dependent styling; the wide-desktop (≥1600px) two-column arrangement assigns explicit rows only to the paired charts, ranking and status rows, so the moved block keeps auto-placing in DOM order.
- Validation: check the screen at your window size (889 px) and at a wide desktop width, confirm the two cards sit directly above the Customer card, then confirm the PDF page order matches and the detailed table, filters, Refresh and Excel export still behave as before. Run the existing test suite and inspect the build log.
