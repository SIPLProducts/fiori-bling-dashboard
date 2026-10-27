# Purchase Register: use TOTAL as the purchase value

Yes, SAP's **TOTAL** is already stored for every synced line. Today the screen uses NET_AMT (before tax). Switch to TOTAL.

## What changes
- **Total Purchase Value** tile and the Domestic / Imported / Service tiles use TOTAL (e.g. Domestic Raw Material 24.82 Cr instead of 21.39 Cr).
- All other cards (trend, quarterly, top materials, top vendors, material group, plant, profit centre) use the same TOTAL, so every card adds up to the tile.
- Credit lines (SHKZG = H) still count as minus.

## Technical details
- `purchase-register-data.ts`: read `total` instead of `net_amt`; bump query key so old cached values are dropped.
- Update `tests/purchase-register-data.test.ts` to assert TOTAL.
