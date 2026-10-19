# Order Book: Quarter-wise row and Year dropdown

## What you will see
- **New row right after the four tiles:** four Quarter cards (Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar), same design as Net Sales: Order Value (₹ Cr), order count, change vs previous quarter / same quarter last year, status (complete / partial), small trend bars per month and a coloured highlight on the current quarter.
- Below the cards, the **Quarterly Trajectory & Up/Down Variance Analysis** card, same as Net Sales.
- **Year dropdown** in Smart Filters (Financial Year, April–March, e.g. "FY 2026–27"), multi-select like Net Sales, plus a **Quarter** dropdown (Q1–Q4). Choosing years compares them side by side in the quarter cards.
- All dates use **ERDAT (Created Date)** — the same date the Date Range filter already uses. Quarters follow April–March.

## Filter behaviour (same as Net Sales)
- Year/Quarter and the Date Range filter work together; picking a Date Range clears Year/Quarter, and picking Year/Quarter clears the Date Range.
- Default: current financial year selected.
- Values use NETWR; counts are distinct order numbers; assigned-Plant access applies.
- Quarter row included in the PDF; Open Sales Orders screen unchanged.

## Technical details
- Reuse `buildQuarterSummaries`, `fiscalYearForDate`, `fiscalQuarter` from `src/lib/sd-live.ts` by adapting Order Book rows (`orderDate` → date, `value` → amount, distinct order counting) in a small pure helper `src/lib/order-book-quarters.ts`.
- Extract `QuarterCard` / `QuarterAnalysis` from `sd-live-dashboard.tsx` into a shared component so both screens render the same UI.
- Add `fiscalYears` / `quarters` to Order Book filters (`isBook` branch of `open-sales-orders-dashboard.tsx`), applied before aggregation.
- Tests for quarter totals and year filtering.
- Quality/Production need a frontend rebuild.
