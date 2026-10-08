# Show all dates in Open Sales Orders

## Confirmed count difference
- With ZDOR, ZEOR, and ZSOR selected, the active database contains **358 distinct sales orders with Total AH > 0 across all dates**, versus **130 in FY 2026–27**.
- The count difference comes from the current financial-year restriction, not the distinct-order calculation.

## Changes
- Remove the **Financial Year** dropdown and its automatic current-year restriction from Open Sales Orders Reports.
- Open the report with **all available dates**, retaining **ZDOR, ZEOR, and ZSOR** as the selected document types.
- Keep the optional **Date Range** filter; selecting dates narrows the report, and Clear restores all dates.
- Make Reset restore all dates, the three default document types, and unrestricted Customer, Sales Zone, Products, Division, and Plant selections.
- Apply the same selected data to all summary tiles, charts, Quick View, detailed table, PDF, and Excel, preserving table-only status/search behavior.
- Keep **Pending Orders Against AH** beside Open Quantity and continue counting distinct sales orders with at least one qualifying filtered line where **Total AH > 0**. Its opening count is currently **358**, not a hardcoded target.
- Keep the filters compact and readable after removing Financial Year.
- Leave the launchpad, other reports, SAP sync, stored data, and manual Refresh behavior unchanged.

## Technical details
- Remove year state, options, fiscal-year imports, filter checks, active-filter counting, and year/date exclusivity from this screen.
- Keep existing inclusive order-date filtering and shared filtered datasets; no database or middleware changes.
- Update the report’s saved requirements to reflect the new all-date default.

## Verification
- Test that the default and Reset include records across different financial years and preserve the three document types.
- Test Date Range boundaries and Clear returning to all dates.
- Verify the opening AH count against the same active database scope; currently 358 distinct orders among 1,174 lines.
- Check dashboard, table, PDF, and Excel consistency, removal of Financial Year, filter layout, and preview errors.