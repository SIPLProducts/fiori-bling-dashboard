# Current Stock: rename top cards and add Top 10 Blocked

## Changes
- Rename "Top Unrestr. Stk" to **Top 10 Unrestricted**.
- Rename "Top Stk in QC" to **Top 10 Quality in QC**.
- Add a new card **Top 10 Blocked**: the 10 materials with the highest blocked stock value (SAP `WSPEM`, quantity `SPEME`), shown like the other two cards with a bar, Val in Cr and Qty. Only materials with blocked stock appear; if none, it shows "No stock in this view".
- The three cards sit in one row on wide screens (stacking on smaller ones).

## Technical details
- `src/components/current-stock-dashboard.tsx`: add `blkTop = topVQ(data, r => r.blkV, r => r.blkQ)`, rename titles, grid `lg:grid-cols-3`, red tint for Blocked card. Included in PDF like the other cards.
