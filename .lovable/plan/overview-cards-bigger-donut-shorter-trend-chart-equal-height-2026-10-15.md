# Overview cards: bigger donut, shorter trend chart, equal heights

## 1. Open Orders by Sales Document Type
- Make the donut larger (about 84px up to ~120px) and keep the "40 / Total Orders" text fully inside it.
- Narrow the table a little so it fits beside the donut, and keep the "Value (₹ Cr)" heading on one line where space allows.
- No scrollbars inside the card. Everything fits.

## 2. Open Order Value Trend
- Rename the legend "Open Orders" to "Open". "Partial Delivered" stays the same.
- Make the chart area the same height as the LD Status chart, so the bars stop stretching to the bottom of the card.
- Keep the X-axis labels (1 – 180, 181 – 365, 365 – 730, > 730) fully readable and not cut off at the bottom.

## 3. All four cards
- The four cards stay the same height. Their content sits at the top with even spacing underneath, so the bottom edges line up.
- Card widths (4 / 3 / 3 / 2), data, totals, colors and PDF/Excel exports stay as they are. The PDF picks up the new "Open" label.

## Technical details
- `src/styles.css`: increase `.order-document-grid` donut column and `.order-document-donut` size; tighten table column tracks; give `.order-trend` chart a fixed height that matches the LD Status chart; set the row's cards to `align-items: stretch` with content aligned to the top.
- `src/components/open-sales-orders-dashboard.tsx`: change the legend/series name "Open Orders" to "Open"; give the trend chart the same height as the LD chart, with bottom margin for the rotated ticks.
- Check at 889×529 and on wide screens that nothing scrolls inside the cards.
