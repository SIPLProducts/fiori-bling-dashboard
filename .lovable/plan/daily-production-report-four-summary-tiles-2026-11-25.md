# Daily Production Report: four summary tiles

The six current tiles are replaced by four, in this order:

| Tile | Shows |
|---|---|
| No of Prod Order | Count of distinct **Prod. Order** numbers in the filtered data (the same order on many lines counts once) |
| Prod Val | Sum of the table's **Value (₹)** column |
| Scrap Val | Sum of the table's **Scrap Val (₹)** column |
| Net Prod Val | Prod Val − Scrap Val |

- Values stay in ₹ Cr like the other tiles. They follow all filters (Plant, Material, Year, Month, dates).
- Production Qty, Scrap Qty and Scrap % tiles are removed. Cards and table don't change.

## Technical details
- `src/lib/daily-production-data.ts`: `dprTotals` adds `net = value - scrapVal` (orders already distinct, blanks ignored).
- `src/components/daily-production-dashboard.tsx`: tile list becomes the four above, grid `lg:grid-cols-4`.
- Add a test for the distinct order count and net value.
