# Add Plant-wise Pending

## New dashboard tile
- Add a separate **Plant-wise Pending** tile below the Sales Zone chart, keeping the dashboard on one continuous page.
- Show a compact plant breakdown with **Plant Code / Name**, **Pending Value (₹ Cr)**, **Pending Quantity**, and **Open Order Lines**.
- Include every matching plant, sorted by pending value from highest to lowest, with a total row.
- Keep plant names readable and allow local scrolling when needed rather than compressing the columns.

## Calculation and filtering
- Group the report’s filtered rows by stored plant code, displaying its plant name alongside the code; same-name plants remain separate.
- Pending value is the sum of the existing Open Value; pending quantity is the sum of Open Quantity; line count is the number of order-item rows, not distinct sales orders.
- Include both Open and Partially Delivered rows, using their remaining open values and quantities.
- Apply all Smart Filters, including Plant, Financial Year, and Date Range. Detailed-table search and Status remain table-only.
- Preserve current-year defaults and explicit Refresh behavior. Handle no matching rows cleanly.

## Scope and technical details
- Reuse the already loaded plant, plant name, value, and quantity fields. No database migration, SAP change, or middleware update is needed.
- Preserve the existing summary tiles, charts, detailed table, Excel columns, and PDF contents; the new tile is screen-only for this change.

## Verification
- Reconcile the plant totals with the dashboard’s Open Order Value, Open Quantity, and Total Open Orders.
- Test individual/multiple Plant selections, combined filters, Reset, and empty results.
- Check readable desktop and narrow-screen layout, focused aggregation tests, and preview errors.