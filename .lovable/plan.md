# Sales In Transit (SIT) screen

## Result
- New **Sales In Transit (SIT)** tile in Sales & Distribution, placed right after Net Sales (Net Sales, SIT, Dispatches, Order Book, Open Sales Orders).
- New permission "Sales In Transit (SIT)" in Screen Permissions; existing Sales & Distribution roles get it automatically.
- The screen uses the same design as Order Book: Smart Filters, summary tiles, charts, detailed table, Excel/PDF export, Refresh.

## Removed on SIT
- Quarter filter and quarter cards
- LD
- Top 10 Orders by Customer, Top 10 Orders by Product, Top 10 Orders by Model Wise, Top 10 Regions, Top 10 Sales Men

## Kept
- Summary tiles, Month on Month, Orders by Sales Document Type, Orders By Zone, Plant-wise order received, Main Group, Sub Group (by Division), detailed table, exports.

## Data
- No data yet: every card and the table show an empty "No SIT data from SAP yet" state, and the launchpad tile shows empty figures.
- When you share the SIT SAP API, we add its table, sync and field mapping.

Order Book and Open Sales Orders stay unchanged.

## Technical details
- Add a `"sit"` variant to OpenSalesOrdersDashboard; hide the listed cards/filters via variant flags; data query returns `[]` for now with its own query key.
- Route `/reports/sd/sit` (permission `sd.sit`, tileKey `sd_sit`), unique head() metadata.
- Migration + `deploy/sit/install-sit.sql`: insert the launchpad tile (sort after Net Sales, shift others) and grant `sd.sit` to roles with Sales & Distribution access.
- Quality/Production: run the SQL and rebuild the frontend.
