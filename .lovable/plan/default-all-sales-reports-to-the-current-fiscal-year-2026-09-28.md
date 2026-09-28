# Default all Sales reports to the current fiscal year

## Goal
When a Sales reporting screen opens, automatically select and apply the current April–March fiscal year. On 28 September 2026, that means **FY 2026–27** and records dated **1 April 2026 through today**.

## Changes

1. **Create one reusable current-fiscal-year default**
   - Keep the existing April–March calculation as the source of truth.
   - Provide the fiscal-year key and date bounds from one helper so each report uses the same dates.
   - Keep intentional unfiltered comparison datasets separate so prior-year and quarter comparisons still work.

2. **Apply the default on report opening**
   - **Sales Dashboard:** preselect FY 2026–27 in the Fiscal Year control and immediately filter all cards, charts, alerts, tables, drill-downs, and PDF data.
   - **Sales Analytics:** initialize both the visible selection and executed data query with the current SAP fiscal-year key.
   - **Sales KPI:** initialize its From/To dates to the current fiscal year through today.
   - **Management Sales Dashboard:** open with a Current Fiscal Year date range instead of All Postings, while preserving explicitly shared date filters.
   - **Net Sales Drill-down:** inherit the originating report’s fiscal-year filter; when opened directly without filter parameters, use the current fiscal year.

3. **Make Reset return to the current fiscal year**
   - Reset will clear optional filters but restore the current fiscal-year selection/range instead of returning to all historical data.
   - Users can still manually select another year or clear/change the year where the existing controls permit it.

4. **Leave unrelated reports unchanged**
   - TBN, placeholder reports, and screens without meaningful fiscal-year filtering will not receive an invented year selector.
   - Open Sales Orders will retain its existing order-date choices because it has no fiscal-year control and currently uses a separate fixed date-range model.

## Validation
- Add tests for April–March boundaries, including January–March mapping to the prior fiscal-year key.
- Verify each affected report opens and resets to the current fiscal year.
- Confirm the displayed totals and rows contain only current-fiscal-year posting dates.
- Confirm cross-screen drill-down navigation preserves the selected year and explicit user date selections continue to take priority.

## Technical details
- Reuse `currentFiscalYear()` and add a testable helper for `{ fiscalYear, from, to }` defaults.
- Do not change database data, synchronization, permissions, or report calculations.
