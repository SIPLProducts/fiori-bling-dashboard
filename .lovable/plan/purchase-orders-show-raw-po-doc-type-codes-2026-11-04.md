# Purchase Orders: show raw PO_DOC_TYPE codes

- Document Type comes straight from the SAP field `PO_DOC_TYPE`, shown as the raw code (ZPCP, ZPDM, ZPUD…) with no DOMESTIC/CAPITAL grouping.
- **Donut "PO Value by Document Type":** one slice per code.
- **Document Type filter:** lists each code.
- **Table and Excel:** show just the code, for example "ZPCP".
- Blank codes show as "—". ZINT lines stay excluded.
- The Purchase Orders launchpad card uses the same codes.
- This changes only Purchase Orders. Open Purchase Orders keeps its grouping.

## Technical
- `purchase-orders-data.ts`: set `poType` to the trimmed `po_doc_type` value instead of `poTypeGroup(...)`, and keep `isExcludedPoType`.
- `purchase-orders-dashboard.tsx`: make `typeLabel` return the code only.
- Update the tests in `purchase-orders.test.ts` to expect the raw codes.
