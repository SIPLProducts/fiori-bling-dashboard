# Material Price Movers + Material screen — richer, radiant, clearer

## 1. Material Price Movers card (main Purchase Register screen)
- Add the filter strip from screenshot 1 above the list:
  "Show price changes of at least [2% | 5% | 10% | 20% | 50%] (up or down) and smaller changes with a value effect of [at least ₹1 lakh | ₹5 lakh | ₹10 lakh | ₹50 lakh | Any]".
  A material is shown when its change is at or above the chosen %, or below it but its value effect (latest − first rate × quantity) reaches the chosen amount. Defaults: 2% and ₹5 lakh.
- Show material tiles in the list: each row becomes a radiant-coloured tile with name, first → latest price, % change badge (red up / green down), sparkline, purchases count and value effect.
- 4 KPI tiles at top (Materials tracked, Rising, Falling, Avg change) get radiant gradient fills and icons.
- Keep the earlier quick popup: clicking the eye icon on a tile opens the compact popup (chart + purchase list); clicking the tile itself opens the full material screen.

## 2. Material screen (screen 2) — more beautiful and clear
- Header card with radiant gradient: material name, current price, big coloured % since first, Back button.
- Stat tiles in radiant colours: First price, Latest price, Since first, Lowest, Highest, Total quantity, Total spend, Purchases.
- Price chart: gradient area line with coloured dots (red rises / green falls), value labels; quantity bars in radiant colours; vendor split with radiant bars.
- Period table redesign (screenshot 2):
  - Option "Hide months with no purchase" (on by default); when off, empty months collapse into one faded "No purchase · Oct-24 to Feb-26" row instead of many rows.
  - Coloured pill badges for "vs previous" and "Since first", mini bar for Low–High range, zebra rows, sticky dark header, bold purchase rows.
- Monthly / Quarterly / Yearly toggle and Excel download kept.

## Technical details
- `purchase-material-trend.ts`: add `valueEffect` per trend and `filterMovers(trends, minPct, minEffectInr)` pure helper; add `collapseEmptyPeriods()`; add unit tests for both rules (2%/₹5 lakh cases).
- `material-trend-card.tsx`: filter strip, tile rows, popup restored (reuse previous dialog component).
- `material-price-page.tsx`: restyle with `radiantBar(i)` and `RadiantDefs`, new table.
- Front-end only; no database or middleware changes. Works in light, dark and glassy themes via existing tokens.
