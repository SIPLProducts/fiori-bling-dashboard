# Clear current Open Sales Orders for a fresh sync

- Delete the current Open Sales Orders rows from this connected preview only, after approval, and verify the table is empty.
- Leave SAP settings, sync history, Net Sales, Quality, and Production untouched.
- Perform this as a one-time data cleanup, not a deployment migration, so deployment cannot accidentally delete orders elsewhere.
- You can then run Sync again and click Refresh on the report.

## Expected result

The verified sync mapping now stores SAP `NETWR` directly in `open_value`, without `P_VALUE1` or quantity scaling. Non-zero `NETWR` amounts from the new SAP response will populate Open Value and value-based charts for matching selected filters. Missing or zero `NETWR` remains zero.

## Technical details

Use a one-time authorized deletion of `public.open_sales_orders` in the connected preview and verify its row count is zero. No schema changes or destructive migration files are needed. Quality and Production require the updated middleware mapping to be deployed before their next sync.