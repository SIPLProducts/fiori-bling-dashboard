# Purchase Register screen clean-up

1. **Amounts in Crores, no "Cr" text**: every amount on the screen (top tiles, donut centre, chart tooltips, ranking lists, small tables, the detailed table and its Excel file) stays in Crores, but the "Cr", "₹ Cr" and "Amount in ₹ Cr" text is removed. Column headers become just "Amount". Line counts stay as normal counts, since counts can't be shown in Crores.
2. **Remove the Profit Center Analytics card**. Plant Analytics then uses the full row width.
3. **Top Materials**: remove the Material Code column. Name and Group stay.
4. **Top Vendors**: remove the Vendor Code column. Only the name stays.

## Technical
- Only `src/components/purchase-register-dashboard.tsx` changes: remove the "Cr" text from tooltips, Tile values, card subtitles, RankList/DataTable/CodeTable headers, the header pill and the detailed table/Excel header. Delete the Profit Center card and `pcs`. Remove the code cells from the materials and vendors DataTables. Rankings still group by code.
