# Month Wise Stock – chart and tile fixes

1. **Main Group / Sub Group 1, 2, 3**: replace the plain bar lists with the same column chart used on Purchase Orders List (bars with X axis group names and Y axis values, grouped by plant), values in ₹ Cr like those screens. Empty groups ignored.
2. **Month Wise Inventory**: each month bar gets its own different radiant colour (blue, teal, amber, violet, rose, green…) instead of similar shades, with the value on top.
3. **Tiles**: remove the "Nov-2026" line under each tile value. The month is already shown once in "Data available" beside Refresh, so tiles show only label and value.

## Technical
- month-wise-stock-dashboard.tsx: build group/division data like `grp()` in purchase-orders-dashboard.tsx and render `OrderBookSubGroupChart`.
- Use a multi-hue radiant palette (gradient defs per bar) for the month chart.
- Drop `note={sub}` from Tile.
