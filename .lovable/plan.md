# Clear Open Sales Orders data

- Delete all **1,174 verified rows** from `public.open_sales_orders` in the connected database, as confirmed.
- This database is shared: both preview and published Open Sales Orders reports will become empty until a successful fresh SAP sync.
- Perform a one-time deletion only: **no migration, schema change or deployment file**.
- Leave SAP API Settings, sync history, schedules, Net Sales and all other tables unchanged. Do not trigger a sync.
- Verify the table contains zero rows immediately afterward. An enabled schedule may populate it again later.

## Technical details
Execute a targeted `DELETE` against `public.open_sales_orders` using the authorized database write tool, then check total and active row counts using a read query. Do not delete the Open _Sales _Orders endpoint configuration.