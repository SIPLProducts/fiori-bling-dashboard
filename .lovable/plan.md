## Sales Register: Net Value from NETWR_EX

NETWR_EX is already saved for every synced Sales Register line, so no table or sync change is needed.

### Change
- Net Value reads `NETWR_EX` instead of `NETWR_TOT` everywhere on the Sales Register screen: Net Value tile, trend chart, Distribution Channel donut, Top 10 Customers / Profit Centres / Materials, Plant / Main Group / Sub Group charts, Sales by Model / Model Wise Type, detailed table, Excel and PDF.
- Launchpad Sales Register card uses the same key so it matches the screen.
- Cache key bumped so old values are not shown after the change.

### Technical details
- `src/lib/sales-register-data.ts`: add `netwr_ex` to the selected columns; map `netValue: n(r.netwr_ex)`; bump query key.
- Launchpad Sales Register query: switch value column to `netwr_ex`.
- Add a small test asserting netValue comes from NETWR_EX.
- Files to deploy: `src/lib/sales-register-data.ts`, launch card file, test.
