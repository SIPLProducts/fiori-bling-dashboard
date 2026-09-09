# Net Sales posting drill-down

## Goal
Add a dedicated, authenticated detail page that lists every matching SAP posting line and can be opened from a selected sales month or customer.

## What will change
- Add a **Net Sales Drill-down** page with a compact management header, applied-filter summary, totals, search, CSV export, pagination, and a responsive posting-line table.
- Show key posting fields including posting date, month, document/item, customer, profit centre, material, quantity, amount in local currency, sales type, segment, and sales employee.
- Make month points/labels in the Sales Trend clickable and open the detail page filtered to that month.
- Make customer rows/bars clickable and open the detail page filtered to that customer.
- Preserve the current Net Sales filters when opening the detail page, including date, segment, customer, and profit-centre context.
- Provide a clear **Back to Net Sales** action.

## Technical details
- Use a typed TanStack route with validated search parameters rather than interpolated links.
- Reuse the existing live `ZFISALES_DETAIL` data query and posting-line type; no database changes are required.
- Apply filtering client-side using the existing Net Sales filtering rules, then paginate the resulting rows.
- Keep chart interactions and existing main/sub-group drill-down behavior unchanged.

## Verification
- Open a month from Sales Trend and confirm only that month’s posting lines appear.
- Open a customer from Top 10 Customers and confirm only that customer’s posting lines appear.
- Confirm totals, row counts, search, pagination, export, back navigation, and mobile/desktop table behavior.
