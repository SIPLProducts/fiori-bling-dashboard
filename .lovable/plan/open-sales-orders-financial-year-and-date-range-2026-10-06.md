# Open Sales Orders: Financial Year and Date Range

## Requested behavior
- Selecting a Financial Year clears the selected Date Range.
- Selecting a Date Range clears the visible Financial Year selection, with no years remaining checked.
- Only the most recently selected period filter applies. Other Smart Filters remain unchanged.
- Keep the current financial year as the opening default and preserve Reset and Date Range Clear behavior.

## Technical details
The current date handler sets years to `null`, but the Financial Year dropdown displays `null` as all years checked. Separate the visible cleared-year state from unrestricted year filtering while a Date Range is active, so clearing the year display does not empty the report.

## Verification
Check both selection directions, multi-year selection, Select All, Date Range Clear, and Reset. Confirm the displayed selections, table rows, totals, and charts use the same active period filter.