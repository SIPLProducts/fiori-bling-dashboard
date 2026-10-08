# SAP Sales Document Descriptions

## Confirmed storage
- `VTEXT_DC` is already stored in each SAP row's `raw` data and mapped to the existing `open_sales_orders.sales_type` column.
- The report already loads that column, but its document-type dropdown and card currently group by document code only.
- One code can have multiple descriptions: ZDOR currently contains Domestic Sales, Deemed Export Sales, and SEZ Sales.

## Changes
1. **Dropdown:** list each unique code + description separately, for example `ZDOR — Domestic Sales`, `ZDOR — Deemed Export Sales`, and `ZDOR — SEZ Sales`. Selecting an entry filters that exact combination.
2. **Sales Document Type card:** show descriptions instead of codes, combining rows with the same description across selected codes. Keep counts, values, donut labels, and tooltips consistent.
3. **Default and Reset:** select all available description combinations belonging to ZDOR, ZEOR, and ZSOR. Preserve all-date defaults, Select All/Deselect All, and every other filter.
4. **Missing descriptions:** fall back to the document code rather than inventing a SAP description.
5. Keep every card and the current layout. Apply the selection consistently to the report, detailed table, PDF, and Excel; preserve existing export columns and counting rules.

## Technical details
- Reuse the stored `sales_type` value as the source-backed description; no new database column or migration is needed for this change.
- Centralize combination keys, display labels, default selection, and description grouping in pure report helpers.
- Add tests covering one code with multiple descriptions, exact-combination filtering, shared descriptions across codes, default/Reset scope, and missing descriptions.

## Verification
- Confirm selecting `ZDOR — Deemed Export Sales` includes only its matching rows.
- Confirm default totals remain unchanged and card groups sum to the filtered report total.
- Check readable dropdown/card labels on desktop and mobile, plus PDF and Excel consistency.
