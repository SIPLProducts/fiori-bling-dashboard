# Clear Purchase Register sample data and stored rows

## What changes
1. **Remove sample figures from the Purchase Register screen.** Every card, tile, chart and table stops showing the made-up numbers. Until live data is connected, they show zero or "No data" while keeping the same layout. Filters, the PDF button and the Sync button stay.
2. **Empty the Purchase Register table in the database.** Delete every stored row, then confirm the count is 0. The table design and the SAP API setup stay as they are.

## Not included
- Switching the cards to live SAP data. That is the next step, once you confirm.

## Technical details
- `src/lib/purchase-register-sample.ts`: drop the hard-coded datasets and keep the pure helpers, which return empty results.
- `src/components/purchase-register-dashboard.tsx`: render empty states when there are no rows.
- Data deletion: `DELETE FROM public.purchase_register WHERE true` through the data tool, then verify the count is 0.
- Update `tests/purchase-register-sample.test.ts` to expect empty results.
