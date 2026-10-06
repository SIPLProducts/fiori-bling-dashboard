# Open Sales Orders filter layout and date clearing

## Changes
- Add a clearly labeled **Clear** action inside the Date Range calendar to remove both selected dates. Disable it when no dates are selected.
- Clearing dates leaves Financial Year and all other selections unchanged; the Date Range field returns to **All dates**.
- Arrange all seven Smart Filters in one row when there is sufficient width for readable controls.
- At ordinary desktop widths, including your current preview, use two balanced rows: Financial Year, Date Range, Customer, Sales Zone on the first; Products, Division, Sales Document Type on the second.
- Stack controls appropriately on smaller screens without clipping labels or selected dates.

## Scope
Keep all calculations, dropdown search and bulk selection, fiscal-year/date exclusivity, Reset behavior, manual Refresh, and exports unchanged. Apply this only to Open Sales Orders.

## Technical details and validation
Update the Date Range popover and scoped filter grid in the Open Sales Orders dashboard using existing calendar and button components. Keep the calendar interactive. Verify selecting and clearing a date range, preservation of other filters, readable one-row/two-row layouts, narrow-screen behavior, and a clean preview build.