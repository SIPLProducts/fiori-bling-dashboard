# Rename Dispatches to Sales Register + add Smart Filters

## Rename
- Launchpad card, menu, permission list and screen title: **Dispatches** becomes **Sales Register**.
- The screen address and access permission stay the same, so users who can open Dispatches today keep access.

## Smart Filters on the Sales Register screen
A Smart Filters card at the top (same look as Open Sales Orders: collapse/expand, active-filter count, Clear/Reset), four columns on desktop, two on tablet, one on phone. Fields from the SAP screen, in the same order:

1. Sales Organization (default 1000)
2. Distribution Channel
3. Division
4. Plant
5. Billing Type
6. Billing Document Date (From–To)
7. Billing Document
8. Billing Creation Date (From–To)
9. Sales Document
10. Sales Document Item
11. Customer
12. Sales Office
13. Material code
14. Profit Center
15. Salesman
16. Material Type
17. Region
18. Terms of Payment

- Code fields are multi-select dropdowns (with Select All/Deselect All); dates use Single / From–To pickers.
- Plant and Profit Center lists only show values assigned to the user.
- Below the filters, a "Sales Register data not connected yet" message is shown until the SAP API is supplied. Once you share the API endpoint, request body and a sample response, the dropdowns fill from the data and the filters drive the report.

## Technical details
- `src/lib/screens.ts`: label "Sales Register" for `sd.dispatches`.
- `deploy/align-launchpad.sql` + new migration: update the `sd_dispatches` tile title/subtitle.
- `src/routes/_authenticated/reports/sd/dispatches.tsx`: new title/head, render new `SalesRegisterFilters` component (reusing `FilterMultiSelect` and the date-mode controls) above the placeholder.
