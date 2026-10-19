# Order Book launchpad tile with bars

The Order Book tile on the launchpad will look like the Open Sales Orders tile:
- Title **Order Book**, total **Order Value** in ₹ Cr (NETWR).
- Bars for the top 3 sales document types plus "Others", each showing value and share.
- Last successful sync time (IST), and a link that opens Order Book Report.
- Follows each user's Plant access. Refreshes only on Refresh/Sync, never automatically.

Open Sales Orders tile stays unchanged.

## Technical details
- New `OrderBookLaunchCard` reusing the Open Sales Orders card layout; reads all `order_book` rows (paginated: netwr, document-type description/code) and summarizes them with a generalized `summarizeLaunchOrders` (value field passed in). Add a test.
- Stable query (staleTime Infinity, no refetch on focus/mount).
- In tile-card, render it for the Order Book tile (its kpi_key / route `sd.order-book`).
