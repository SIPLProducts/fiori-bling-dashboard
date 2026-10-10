# Simplify Distribution Channel display

## Changes
- Remove the **Distribution Channel** dropdown from Smart Filters.
- Keep the **Distribution Channel** column in the detailed table, showing only its description (for example, **Domestic Sales**), without codes such as **01**.
- Keep four desktop columns, with the remaining fields arranged as:
  - Row 1: **Plant · Sales Document Type · Date Range · Customer**.
  - Row 2: **Sales Zone · Products · Division**.
- Keep readable tablet and phone arrangements.
- Ensure no hidden Distribution Channel selection restricts report results after removing the control.

## Scope
Preserve date modes, dotted dates, newest-first ordering, all other filters, charts, totals and downloads. Keep stored SAP channel data and existing Excel channel columns unchanged; simplify only Smart Filters and the on-screen channel display.

## Technical details and validation
Remove the dropdown in `src/components/open-sales-orders-dashboard.tsx`, clean up unused channel options references, and show stored channel descriptions without a code fallback in the detailed table; use a dash when no description is available. Preserve table column spans. Verify seven visible filters, four-column desktop layout, description-only channel cells, unchanged report scope and no overflow on smaller screens.