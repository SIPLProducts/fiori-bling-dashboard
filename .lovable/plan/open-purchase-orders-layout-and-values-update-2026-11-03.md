# Open Purchase Orders: layout and values update

## Answer: which keys Status uses
SAP does not send a status key. Status is calculated from these keys, in this order:
1. Delivery complete: `ELIKZ` = "X"
2. Overdue: `EINDT` (delivery date) is before today
3. Partially received: `MENGE1` > 0 or `DMBTR1` > 0
4. Open: anything else

## Changes
1. **Remove** the Material Group Summary card.
2. **Remove the Status column** from the table and from the Excel download. The Delivery Status filter stays.
3. **Card order:**
   - Row 1: PO Value by PO Type, Delivery Aging Status, Daily PO Value Trend
   - Row 2: Top 10 Vendors by Open Value, Top 10 Materials, Plant Analytics, Storage Location Distribution
   - Row 3: PO Value by Main Group, full width
   - Row 4: PO Value by Sub Group 1, Sub Group 2, Sub Group 3
4. **All values in Cr.** Everywhere on this screen, the table and Excel included, values show in ₹ Cr with 2 decimals. Table headers become "PO Value (Cr)", "MIGO Value (Cr)" and "Open Value (Cr)".
5. **Totals row** at the bottom of the table, covering all filtered rows. It shows PO Qty, PO Value, MIGO Qty, MIGO Value and Open Value. Excel gets the same totals row.
6. **Delivery aging uses SAP `DAYS`**, the same way other screens do, instead of a date calculation. The "Not due" bucket is removed. The buckets match your screenshot: 1–180, 181–365, 365–730 and > 730 days.
7. **Values beside each slice** in PO Value by PO Type and Delivery Aging Status: a legend shows the name, the Cr value and the share.

## Technical
- Files: `src/components/open-po-dashboard.tsx` and `src/lib/open-po-data.ts` (`agingBucket` changes to use `r.days`, and `AGING_BUCKETS` loses "Not due").
- The Overdue status keeps using the delivery date. No database or sync changes.
