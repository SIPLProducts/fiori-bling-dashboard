# Inventory Aging tiles

- Remove the Closing Stock and Closing Qty tiles.
- Show the ageing tiles in this order: >365 Days, 181–365 Days, 91–180 Days, 0–90 Days.
- Add a "Total Val" tile at the end, showing the sum of the four ageing tiles (₹ Cr).
- Five tiles in one row on desktop; same in PDF. Table and Excel unchanged.

## Technical
In `src/components/so-ageing-dashboard.tsx`, rebuild the tile array: buckets 3,2,1,0, then Total = t.v sum; grid `lg:grid-cols-5`.
