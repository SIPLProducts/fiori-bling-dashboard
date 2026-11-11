# Purchase Orders: filters and launchpad doc types

## Purchase Orders screen
- Filters card opens collapsed by default (click "Filters" to expand).
- Remove the Main Group, Sub Group 1 and Sub Group 2 filter dropdowns. The Main Group / Sub Group charts, table and Excel columns stay.

## Launchpad Purchase Orders card
- Replace the grouped DOMESTIC/PROJECT/... list with each document type name (BSART, same names as the screen's Document Type card), sorted by value, with lines and ₹ Cr.
- Heading changes from "PO Value by PO Type" to "PO Value by Doc Type".
- Totals (₹ Cr, POs, lines) unchanged.

## Technical
- purchase-orders-dashboard.tsx: `useState(true)` for collapsed; drop mainGroup/sub1/sub2 from Filters type, EMPTY and filter row.
- purchase-orders-launch-card.tsx: build type list by grouping INR rows on `poType` instead of openPoTypeSummary groups.
