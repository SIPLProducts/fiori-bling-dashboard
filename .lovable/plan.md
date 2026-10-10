# Remove Distribution Channel from Open Sales Orders

## Changes
- Remove the **Distribution Channel** dropdown from Smart Filters.
- Remove the **Distribution Channel** column from the detailed table.
- Keep four desktop columns, with the remaining fields arranged as:
  - Row 1: **Plant · Sales Document Type · Date Range · Customer**.
  - Row 2: **Sales Zone · Products · Division**.
- Keep readable tablet and phone arrangements.
- Ensure no hidden Distribution Channel selection restricts report results after removing the control.

## Scope
Preserve date modes, dotted dates, newest-first ordering, all other filters, charts, totals and downloads. Keep stored SAP channel data and existing Excel channel columns unchanged; this removal applies only to Smart Filters and the on-screen table.

## Technical details and validation
Remove the dropdown and displayed table cells in `src/components/open-sales-orders-dashboard.tsx`, clean up unused channel display/options references, and adjust table total and empty-state column spans. Verify seven visible filters, four-column desktop layout, correctly aligned table totals, unchanged report scope and no overflow on smaller screens.