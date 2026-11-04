# Purchase Orders: remove Delivery Status, confirm Document Type

## Remove Delivery Status (Purchase Orders screen only)
- Remove the "Delivery Status" column from the detail table and the Excel download.
- Also remove the Delivery Status filter and the Delivery Status donut card, so the screen no longer shows it anywhere. Row 1 becomes PO Type, Top 10 Vendors and Top 10 Materials.

## Document Type
- Keep using SAP key `PO_DOC_TYPE`. Group it as DOMESTIC / PROJECT / CAPITAL / SERVICE / IMPORTED / OTHERS (same table as Open Purchase Orders), and leave out ZINT.
- In the table and Excel, show the column as "Document Type" with the code and group, for example "ZPCP – CAPITAL".
- Rename the filter and donut heading from "PO Type" to "Document Type".
- Unknown codes such as ZPUD show as OTHERS until you tell us their group.

## Technical
- `purchase-orders-dashboard.tsx`: drop the status filter, donut, table/Excel column and `deliveryStatus` usage; rename labels.
- Grouping already reuses `poTypeGroup` / `isExcludedPoType` from `open-po-data.ts`. Existing tests stay in place.
