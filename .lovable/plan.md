# Compact Cash Flow screen

## What changes
1. **Smart Filters in one row** (desktop, 1100px+): all six dropdowns (Plant, Profit Centre, GL Code, PC Group, Classification, Nature) side by side; tighter card padding, smaller labels/gaps. Tablet keeps 3 columns, phone 1.
2. **Smaller fonts and spacing** across the Cash Flow screen: title 25→18px, KPI values 25→18px, KPI/panel headings 13–14→12px, table text 12→11px, cell padding 6→3px, gaps/margins 14→8px, header margin 24→8px.
3. **Fit on one screen (desktop):** shorter charts (172→130px, nature/group body 250→180px), compact pagination; the transaction ledger shows fewer rows (default 10) with its own internal scroll so filters, KPIs and charts fit without page scroll. If the browser window is very short, the ledger area scrolls inside itself rather than shrinking text further.
4. Nothing removed; data, filters, exports, Refresh and launchpad unchanged. Tablet/phone still stack and may scroll.

## Technical details
- `src/styles.css`: add `@media (min-width:1100px) .cash-filter-card .cash-filters { grid-template-columns: repeat(6,minmax(0,1fr)) }`, reduce `.cash-*` sizes listed above.
- `src/components/cash-flow-dashboard.tsx`: reduce filter card padding classes; ledger table wrapper gets max-height `calc(100vh - offset)` with sticky header.
- Verify with Playwright at 1280×720 and 951×529 plus phone.
