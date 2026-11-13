# Month Wise Stock – Top 10 Plants as column chart

- Replace the Top 10 Plants list with a column bar chart like the Month Wise Inventory card: plant names along the X axis, value on the Y axis, each bar a different radiant colour with the value on top.
- Uses the latest month in the filter range, top 10 plants by CB Val, values in full (same as now).

## Technical
- month-wise-stock-dashboard.tsx: replace `groupCard("Top 10 Plants", ...)` with a recharts ComposedChart reusing the `mws-g*` gradient defs (unique ids per chart).
