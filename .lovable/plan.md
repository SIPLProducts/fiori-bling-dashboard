# SIT by Main Group: split by Division like Sub Group

## Result (Sales In Transit screen only)
- **SIT by Main Group** becomes a stacked bar chart: one bar per main group, split into colored Division pieces, the same way **SIT by Sub Group** looks today.
- Same colors per division as the Sub Group card, the total value above each bar, and a Division legend underneath.
- Tooltip: main group name, each division's SIT Value (₹ Cr) and SIT count, then the total.
- Also shown this way in the PDF.

Order Book and Open Sales Orders Main Group cards stay as they are.

## Technical details
- `open-sales-orders-dashboard.tsx`: compute `mainByDivision = summarizeGroupsByDivision(rows, mainGroup key)` alongside `subByDivision`; for `isSit` render `OrderBookSubGroupChart` with it in the Main Group panel.
- `order-book-subgroup-chart.tsx`: add a `groupLabel` prop ("Main Group" / "Sub Group") for the tooltip heading; share one division color order across both cards.
