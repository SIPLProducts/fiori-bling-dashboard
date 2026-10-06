# Open Sales Orders detailed table controls

## Changes
- Add a Status dropdown immediately to the left of Download Excel, with All (default), Open, and Partially Delivered.
- Add a search input in the detailed-table header. Filter as the user types, case-insensitively, across every displayed data column, including dates, quantities, values, and status.
- Apply status and search together, after Smart Filters, across all matching rows—not just the current page. These controls affect the detailed table only; dashboard tiles and charts remain unchanged.
- Update the matching-row count and empty-results message. Reset to page 1 when filters or search change.
- Move the page indicator and Previous/Next buttons together below the table, aligned left. Keep 10 rows per page and disable unavailable navigation.
- Download Excel exports all business columns for every matching row across all pages, respecting Smart Filters, Status, and search.

## Technical details
- Preserve the existing status definition: delivered quantity greater than zero is Partially Delivered; otherwise Open.
- Derive a table-only filtered dataset from the existing Smart Filter results, and use it consistently for counts, pagination, and Excel export.
- Match search against displayed text and underlying numeric/date values, so formatted values and raw values can both be found.
- Reuse existing input, selector, and button styles; allow the toolbar to wrap without overlap on narrow screens.
- No database, SAP mapping, middleware, or PDF changes.

## Verification
- Check All, Open, and Partially Delivered individually and combined with search.
- Check searches for order number, line item, customer, product description, date, quantity, value, and status.
- Verify searches include rows beyond the first page, page reset, no-results handling, Excel row counts, and bottom-left pagination.
