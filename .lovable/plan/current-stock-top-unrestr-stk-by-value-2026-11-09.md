# Current Stock: Top Unrestr. Stk by value

- Rename card "Top Unrestr. Stk (Q)" to "Top Unrestr. Stk".
- Rank the top 10 materials by unrestricted value (WLABS) instead of quantity.
- Each row shows the bar plus two columns: Val (in Cr) and Qty (LABST with unit), with small column headings.

## Technical
- `src/components/current-stock-dashboard.tsx`: group by matDesc summing unrV and unrQ, sort by unrV, slice 10; render a small Val/Qty list using the same radiant bars.

# QC card
- Rename "QC / Blocked / Transfer" to "Top Stk in QC".
- Show top 10 materials by QC value (WINSM) only, with Val (Cr) and Qty (INSME) columns, same style as Top Unrestr. Stk. Blocked and Transfer removed from this card.
