# Connect Open Sales Orders to its live SAP API

## Result

- Rename the Sales Dashboard chart from **Sales by BSARK** to **Sales by New_Repl**. Its existing live `new_repl` data, filters, and chart behavior remain unchanged.
- Replace the Open Sales Orders screen’s sample records with synchronized data from the existing **Open_Sales_Orders** SAP endpoint.
- Keep the current Open Sales Orders design, filters, KPI cards, charts, detailed table, permissions, and launchpad destination.

## Open Sales Orders storage

- Create `public.open_sales_orders` for the API’s order-item rows.
- Store the useful response fields as typed columns for filtering and reporting, including sales order/item, order and delivery dates, order/customer/material details, quantities, currency/value, sales organization/channel/division, sales office/group, profit centre, region, sales type, product grouping, status, and days open.
- Preserve every complete SAP response object in a `raw` JSON column so no supplied field is lost.
- Add sync metadata for source endpoint, request scope, snapshot, row hash, occurrence number, active state, and timestamps.
- Grant authenticated users read access and service processes write access, enable row-level security, and restrict user reads to the existing Open Sales Orders screen permission.
- Add indexes for active snapshots and the main dashboard filters.

## Safe synchronization

- Add a dedicated Open Sales Orders mapper rather than sending these rows through the ZFISALES mapper.
- Use the same safe snapshot pattern as Total Sales: stage every received occurrence, validate the complete count, activate the new snapshot, and replace only the previous snapshot for the same request scope.
- Preserve repeated identical rows with occurrence numbers; a failed or partial run leaves the previous completed snapshot active.
- Route scheduled and manual runs by endpoint name so `Open_Sales_Orders` writes only to `open_sales_orders`, while `Sales_Reports_KPI` continues writing only to `zfisales_detail`.
- Record received, stored, replaced, invalid, response size, timing, and status in the existing synchronization history.

## Current-date payload

- Keep the supplied payload keys and saved values unchanged except for `fkdat`.
- Immediately before every Test, manual, and scheduled call to `Open_Sales_Orders`, set `fkdat` to the current local calendar date in `YYYYMMDD` format.
- Do not apply the existing BUDAT posting-window behavior to this endpoint.
- Continue using the already saved SAP system URL, environment-specific HTTP/HTTPS handling, credentials, and existing schedule; no duplicate static schedule will be added.

## Live dashboard

- Read active rows from `open_sales_orders` and transform them into the existing dashboard model.
- Drive all six KPIs, six filters, trend, zone/type charts, profit-centre/main-group/customer/product views, pagination, insights, alerts, and recommendations from synchronized rows.
- Use API fields such as `VBELN`, `POSNR`, `ERDAT`, `DELV_DAT`, `KUNNR_SP`, `NAME1_SP`, `MATNR`, `MAKTX`, `KWMENG`, `NETWR`, `WAERK`, `VKORG`, `VTWEG`, `SPART`, `VKBUR`, `VKGRP`, `PRCTR`, `VTEXT_DC`, `BEZEI`, `BEZEI1`, `MTART`, `DAYS`, and status fields where supplied; blanks remain blank/Unassigned rather than receiving invented values.
- Show an empty state when no completed Open Sales Orders snapshot exists, instead of falling back to sample data.

## Deployment support

- Add the identical schema/function SQL for self-hosted Quality and Production.
- Rebuild the checked-in middleware synchronization bundle so hosted, Quality, and Production use the same mapping and current-date logic.
- Update generated database types after the migration.

## Validation

- Test `fkdat` generation with a fixed clock and confirm only that payload key changes.
- Test representative response mapping, numeric/date normalization, duplicate preservation, scope isolation, successful replacement, and failed-run rollback.
- Run a manual `Open_Sales_Orders` sync and confirm stored counts match received valid rows.
- Verify the live Open Sales Orders KPIs, filters, charts, pagination, empty state, and desktop/mobile layouts.
- Confirm `Sales_Reports_KPI` and its `zfisales_detail` synchronization remain unchanged.
