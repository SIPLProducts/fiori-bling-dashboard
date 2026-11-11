# Purchase Orders: clear local data + card cleanup

## 1. Clear saved data (local)
- Delete all 87 saved lines from the Purchase Orders table so you can sync fresh.

## 2. Screen changes (Purchase Orders)
- **Document Type (BSART):** already used as the Document Type filter and donut; rename the donut card "PO Value by Document Type" to **Document Type**.
- **Remove cards:** Material Group (donut), Material Group Summary (table), Delivery Aging Status, Division.
- **Keep sub groups:** Main Group, Sub Group 1 and Sub Group 2 cards stay in their row (now 3 cards instead of 4).
- The Purchasing Group card becomes full width where Delivery Aging was removed.
- Filters, tiles, trend, Top Materials/Vendors, Plant Analytics, table and Excel stay unchanged.

## Technical
- Data: `DELETE FROM public.purchase_orders WHERE id IS NOT NULL;`
- Edit `src/components/purchase-orders-dashboard.tsx` only: delete the four card blocks, adjust the two grid rows, rename the document-type card title.
