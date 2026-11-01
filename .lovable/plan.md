# Material Price Movers tiles, filter on material screen, coloured top tiles

## 1. Material Price Movers card
- Put the 4 summary tiles (Materials tracked, Rising, Falling, Average change) in one row on desktop. They will still wrap onto more rows on small screens.
- Remove the "Show price changes of at least…" line from this card. The card will list every material that shows a steady trend.

## 2. Material screen (screen 2)
- Add the same line below the header: "Show price changes of at least [2% / 5% / 10% / 20% / 50%] (up or down) and smaller changes with a value effect of [₹1 / 5 / 10 / 50 lakh, or don't include]".
- The selection filters this screen:
  - Period table: only periods whose change from the previous purchase meets the chosen % or value effect. The first purchase is always shown as the starting point.
  - Price chart dots: periods that pass are highlighted; the others are faded.
  - A note shows "X of Y periods shown".
- Value effect = (price change from the previous period) × quantity bought in that period, in ₹.

## 3. Top tiles on the main Purchase Register screen
- Total Purchase Value, Domestic, Imported and Service tiles get full colour gradient backgrounds with white text and icons, like the material tiles (blue, teal, purple and orange).

## Technical details
- `material-trend-card.tsx`: change the KPI grid to `lg:grid-cols-4`; remove the filter state and strip; call `materialTrends` with the default rules.
- `purchase-material-trend.ts`: add a pure `periodPasses(prevRate, rate, qty, minPct, minEffectInr)` helper, with unit tests for 2% and ₹5 lakh.
- `material-price-page.tsx`: filter state, filter strip and table/chart filtering.
- `purchase-register-dashboard.tsx`: `Tile` gets the gradient fill.
- Changes are only on screen; no data or sync changes.
