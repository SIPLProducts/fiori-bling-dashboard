# Material screen: vendor colours and Main vendor column

## Changes
1. **Price by day/month/quarter/year table**: remove the "Main vendor" column.
2. **Purchases by date table**: the Vendor cell gets a radiant colour background with white text. Each vendor keeps one fixed colour, so every row from the same vendor has the same colour.

## Answer: what changes with Daily / Monthly / Quarterly / Yearly
- **Changes**: the price chart, the Quantity bought bars, the Price by … table, and the tiles **First price**, **Latest price**, **Since first** and the "Price now" headline. These use the average price of the first and last period, so the values move with the period you pick.
- **Does not change**: Quantity bought total, Lowest paid, Highest paid, Purchases, Total spend, the Purchases by date table, and the main Purchase Register screen totals and cards.

## Technical details
- File: `src/components/material-price-page.tsx` only.
- Vendor colour: build a vendor → index map in order of first appearance, then use `radiantBar(index)` as the cell background with `text-on-radiant`.
- Drop "Main vendor" from the header list and the row cell, and set the gap row colSpan to 6.
