# Sales In Transit: Month on Month row

## Colour key
- Remove the coloured squares and Division names below the Month on Month chart, on screen and in the PDF.
- The bars stay split by Division in the same colours, and each month's total stays on top of its bar.
- The tooltip still lists each Division with its colour, ₹ Cr value and number of invoices.

## Card widths
- Month on Month gets 8 of 12 columns, about two-thirds of the row.
- SIT by Sales Document Type gets 4 of 12 columns, about one-third.
- These widths apply on tablet and desktop screens, including your current window size. Today the two cards share the width equally at that size.
- On phones, the cards stay stacked one under the other.
- Order Book and Open Sales Orders keep their current layout.

## Technical details
- `order-book-month-chart.tsx`: delete the `sit` legend div.
- `open-sales-orders-dashboard.tsx`: add an `order-overview-sit` class to the overview row when `isSit`.
- `styles.css`: from 768px up, `.order-overview-sit` uses `grid-template-columns: minmax(0,2fr) minmax(0,1fr)` with no last-child span. Place the rule after the `.orders-compact` overrides so it wins.
