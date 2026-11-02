## Changes

1. **Price by day/month/quarter/year table** (material screen)
   - Remove the Quantity column.
   - Add a "Price diff (₹)" column in its place. It shows the latest price in that period minus the first price in that period, in red if the price went up and green if it went down.

2. **Material Price Movers card**
   - Only include materials whose code starts with 1, 2, 3, 41, 42 or 68. All other materials are left out of the Rising and Falling lists and their counts.
   - The other cards on Purchase Register (totals, Top Materials, and so on) stay the same.

## Technical details
- `purchase-material-trend.ts`: add a pure `isPriceMoverMaterial(code)` helper (prefix list `["1","2","3","41","42","68"]`), apply it in `materialTrends` input filtering inside `material-trend-card.tsx`, and add unit tests for included and excluded codes.
- `periodSeries`: add `firstRate`/`lastRate` per period (ordered by date) and expose `diff = lastRate - firstRate`; render this in place of the Quantity column in `material-price-page.tsx`. Add a test for it.
