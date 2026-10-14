# Cash Flow screen matching the reference

## Scope
- Replace the existing Cash Flow coming-soon screen under Financial Accounting with a working dashboard using sample data, as requested.
- Match the attached reference’s visual hierarchy, spacing, light-blue background, white panels, typography, chart colors, and desktop proportions. Use the image only as a reference, not as embedded screen content.
- Retain the portal navigation, existing Cash Flow access permission, and remembered Light/Dark setting.

## Layout
1. **Header:** Cash Flow Dashboard at the left with the reference subtitle. Replace the screenshot’s production-connection badge with **Sample Data**; do not claim a live SAP connection.
2. **Filters:** Plant, Profit Centre (PC), GL Code, PC Group, Classification, Nature, Year, Quarter, in that order and on one row where space permits.
3. **Four summary tiles:** Net Cash Flow with a sparkline and View History; Total Credits with green amount and sparkline; Total Debits with red amount and sparkline; Active Plants & GLs with both counts.
4. **Chart row:** Credit vs Debit Trend occupies half the row, with two adjacent chart tracks and a Monthly/Quarterly switch; Cash Flow by Plant & Profit Centre occupies one quarter with stacked horizontal bars; Cash Flow by Nature & PC Group occupies one quarter with a donut and right-side group breakdown.
5. **Full-width ledger:** Cash Flow Transaction Ledger, search and Download Report at the top-right, reference-style header, signed balance colors, and bottom pagination. Columns: Plant, Profit Centre, PC Group, GL Code, Classification, Nature, Credit (₹), Debit (₹), Net Balance.
6. **Footer:** Clearly identify sample data; omit invented production server and build-version claims.

## Behavior and data
- Use one deterministic sample transaction dataset with dates and all eight filter dimensions. All totals, charts, counts, and ledger records derive from it.
- Preserve the reference’s appearance rather than copying its inconsistent example balances or percentages. Net Cash Flow and ledger Net Balance use Credits minus Debits; donut shares total 100%.
- Filters update the whole dashboard; ledger search and pagination affect only the table. Empty selections/results show a clear empty state without fabricated amounts.
- Monthly/Quarterly switches the trend grouping. View History opens the corresponding sample cash-flow history.
- Download Report exports the complete filtered and searched ledger to Excel, not just the visible page.
- Display summary amounts in ₹ Crores and ledger amounts in rupees with Indian number formatting.

## Responsive layout
- Match the screenshot’s four-tile and 2:1:1 chart arrangement on wide desktops.
- At smaller desktop/tablet widths, wrap filters and chart panels as needed to keep every label and amount readable; stack on phones.
- Keep horizontal scrolling local to the ledger. Do not force a no-scroll screen at the expense of chart visibility.

## Technical details
- Keep `/reports/fi/cash-flow` and its `fi.cash-flow` permission; update its existing page metadata for the dashboard.
- Add focused Cash Flow presentation components and a browser-safe sample-data/aggregation module, using existing Recharts, design-system controls, semantic color tokens, and Excel export tools.
- No database migration, SAP sync, or changes to TBN, Net Sales, or Open Orders.
- Record the sample-data architecture in project guidance and keep a lean implementation checklist.

## Verification
- Test Credits minus Debits, filter combinations, monthly/quarterly aggregation, active counts, and full filtered export selection.
- Verify navigation from Financial Accounting, filters, history, search, pagination, and downloaded Excel end to end.
- Compare the rendered desktop screen to the reference; inspect the current 951×529 size, wide desktop, tablet, and phone for readable text and no unintended overflow, in both themes.
- Check preview build and runtime errors before completion.