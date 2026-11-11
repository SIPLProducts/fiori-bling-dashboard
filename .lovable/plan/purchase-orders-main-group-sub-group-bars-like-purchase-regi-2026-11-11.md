# Purchase Orders: Main Group / Sub Group bars like Purchase Register

Show the Main Group, Sub Group 1 and Sub Group 2 cards on Purchase Orders with the same bar chart Purchase Register uses: bars per group, values in ₹ Cr, coloured by plant.

- Main Group: full-width card.
- Sub Group 1 and Sub Group 2: one row, side by side.
- Lines with an empty group are left out of that card, the same as on Purchase Register.
- Only rupee lines count, so the values match Total Val.
- Filters, tiles, table and Excel stay the same.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: replace the three `BarList` group cards with `OrderBookSubGroupChart`, fed by `summarizeGroupsByDivision` over the filtered INR rows (value = netValue, order = poNo, division = plant short or plant name). Use the Purchase Register empty state ("No data").

## Plant short name (DIVISION_NAME)
- Wherever Purchase Orders shows a plant (Plant filter, Plant Analytics bars, group-bar plant colours, table and Excel Plant column), use DIVISION_NAME as the plant short name, e.g. "1200 VSEZ". If DIVISION_NAME is empty, fall back to the current plant name.
- Technical: in `purchase-orders-dashboard.tsx`, derive the plant label from `r.division || r.plantName`.
