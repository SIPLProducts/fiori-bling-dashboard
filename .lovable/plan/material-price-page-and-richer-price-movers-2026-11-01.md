# Material price page and richer Price Movers

## 1. Material detail page (opens when a material is clicked)
- Clicking a material hides all Purchase Register cards and shows a full-page material view (instead of the current popup), with a **Back** button at the top that returns to the main screen with filters kept.
- Layout follows the attached screenshots:
  - **Header**: material name, code, unit (₹ per KG/NOS), Monthly / Quarterly / Yearly switch.
  - **Price now**: large latest price with coloured % vs previous period and "vs <month> (₹ x)".
  - **Stat row**: First price (with month), Since first %, Lowest paid, Highest paid, Quantity bought, Purchase count, Total spend.
  - **Price line chart**: area-filled line, coloured dots (red rise / green fall) with value labels, axis in ₹ per unit.
  - **Quantity bars** under the chart (quantity per period), and a small **Vendor split** list (spend per vendor).
  - **Period table**: Month, Price, vs previous, Since first, Low–High, Quantity, Vendor; months with no purchase shown faded as "No purchase".

## 2. Price Movers card made clearer
- Four KPI tiles on top (like screenshot): Materials tracked, Rising, Falling, Average change — each with coloured icon tile.
- List with search box and chips **All / Rising / Falling**, sort dropdown (Highest spend, Biggest rise, Biggest fall).
- Each row: name + code/unit, a small sparkline of price history, latest price and coloured % pill. Rising rows red sparkline, falling green.
- Existing rules kept (only frequently purchased materials with a consistent trend).

## Technical
- `material-trend-card.tsx`: replace Dialog with `selected` state lifted to `purchase-register-dashboard.tsx`; when set, dashboard renders `MaterialPricePage` instead of cards.
- New `src/components/material-price-page.tsx` (Recharts area/bar, radiant colours, theme tokens incl. glassy).
- Add pure helpers in `purchase-material-trend.ts`: `periodSeries(points, "month"|"quarter"|"year")` with gap fill, `vendorSplit`; extend existing test.
- No database or middleware changes.
