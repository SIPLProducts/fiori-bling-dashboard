# Update Open Sales Orders Quick View and Plant filtering

## Requested changes
- Remove **Highest Quantity** from Quick View on screen and in the PDF. Keep Longest Aging and Highest Value, arranged as two balanced tiles without an empty space.
- Add a searchable **Plant** dropdown to Smart Filters with checkboxes, Select All, and Deselect All.
- Show plant code and plant name together when a name is available, using the plant code as the selection key.
- Start with all plants included. Make Plant selection affect all dashboard results, the detailed table, PDF results, and Excel download; Reset restores all plants.
- Arrange the eight Smart Filters in two readable desktop rows, using one row only where space permits.
- Add **Plant** beside Division in the detailed table, showing code and name where available. Include both in table search and preserve pagination and horizontal scrolling.
- Keep the existing **Plant** and **Plant Name** Excel columns without duplicating them, and verify they contain the matching filtered rows.

## Technical details
- Reuse the loaded `plant` and `plantName` fields; no database migration, SAP mapping, or middleware change is needed for this presentation change.
- Add Plant to the existing shared dashboard filter state and active-filter count, retaining unrestricted versus explicit no-selection semantics.
- Extend the shared detailed-table search to plant code and name, and update the empty-state column span.
- Preserve Financial Year/Date Range exclusivity, current-year defaults, document-type defaults, and manual Refresh behavior.

## Verification
- Confirm Highest Quantity is absent on screen and in PDF, and the remaining Quick View tiles fit cleanly.
- Check Plant search, individual and multiple selection, Select All, Deselect All, and Reset.
- Confirm dashboard values, table counts, and Excel rows agree under the same Plant selection.
- Verify Plant text searches correctly across pages and Excel retains both Plant columns.
- Check layout at narrow and wide widths, PDF appearance, relevant tests, and preview errors.