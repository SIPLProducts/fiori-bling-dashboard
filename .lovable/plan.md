# Material Price Movers and material screen tidy-up

## Why the bars/line look empty
For the material in the screenshot, all 5 purchases fall in June 2026. Monthly, Quarterly and Yearly all merge them into one point, so the chart shows a single dot and the quantity bars show one bar. The switch does work, but there is nothing to spread out.

## Changes

1. **Material Price Movers card (main screen)**
   - Remove the four tiles (Materials tracked, Rising, Falling, Average change).
   - Card inside background becomes a soft, light radiant wash (pale blue → teal → purple → orange) while keeping the coloured border. Text stays readable in Light, Dark and Glassy.

2. **Material screen header**
   - Remove the material name and code text beside the Back button (it is already shown in the coloured banner).

3. **Daily / Monthly / Quarterly / Yearly switch**
   - Add a **Daily** option (one point per purchase date) to the switch.
   - Open on Daily automatically when all purchases sit in one month, otherwise Monthly.
   - The price chart, quantity bars and "Price by …" table all follow the switch, so each choice visibly changes them.
   - Quantity bars get a minimum visible height and value labels so they always show.

4. **New "Purchases by date" table**
   - One row per purchase: Date, Document No, Vendor, Plant, Quantity, Unit, Rate ₹, Change vs previous purchase (coloured badge), Value ₹ Cr.
   - Newest first, striped rows, radiant header, paging for long lists; included in the Excel download (already contains these lines).

## Technical details
- `material-trend-card.tsx`: delete Kpi row; inner section background uses a light `linear-gradient` with `color-mix(... , var(--card))`.
- `material-price-page.tsx`: drop the h2/p beside Back; add `"day"` to `Period`; default period computed from distinct months; add per-line table.
- `purchase-material-trend.ts`: `periodOf` supports `day` (key YYYY-MM-DD, label DD-MMM-YY); add a unit test for daily grouping.
