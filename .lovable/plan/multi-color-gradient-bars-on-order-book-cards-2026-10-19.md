# Multi-color gradient bars on Order Book cards

On the Order Book Report screen and its PDF, the bars in **Month on Month**, **Orders by Main Group** and **Orders by Sub Group** each get a different color with a gradient fill. They use the same set of colors already on Orders By Zone and Plant-wise order received.

Open Sales Orders keeps its current single-color group bars.

## Technical details
- Use the shared `OrderChartGradients` and `ORDER_CHART_COLORS` from order-chart-presentation, with one `<Cell>` per bar cycling through the palette.
- Add a `multicolor` prop to OpenOrdersGroupChart, passed only when the screen is Order Book. OrderBookMonthChart always uses multi-color bars.
- Labels, tooltips and sizes stay the same.
