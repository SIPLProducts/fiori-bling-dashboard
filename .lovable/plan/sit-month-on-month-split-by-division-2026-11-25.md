# SIT Month on Month — split by Division

## What changes
On the Sales In Transit screen, the Month on Month card will show each month's bar split into coloured parts, one per Division (same colours as the Main Group / Sub Group charts).

- **Bar:** stacked by Division; month total value still shown on top.
- **Tooltip:** month name, then each Division with its ₹ Cr value and invoice count, then the month total.
- **Legend:** small colour key of Divisions below the chart.
- Order Book's Month on Month stays as it is today.
- PDF shows the same stacked bars.

## Technical details
- `order-book-months.ts`: add `byDivision: Record<string, {value, orders}>` to each MonthSummary (distinct invoices per division) plus a helper returning the sorted division list; add a test.
- `order-book-month-chart.tsx`: when `sit`, render one `<Bar stackId>` per division using ORDER_CHART_COLORS gradients, total LabelList on the last bar, tooltip listing divisions.
