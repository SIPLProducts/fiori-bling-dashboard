# Remove Sales Mix and show tables oldest date first

## What changes
1. **Net Sales screen:** remove the "Sales Mix" card (screen and PDF). The Segment row keeps Segment, Customer Contribution and Sales Trend.
2. **Sales In Transit table:** rows sorted by SIT creation date, oldest first.
3. **Open Sales Orders table:** rows sorted by sales order creation date, oldest first.
4. **Open Purchase Orders table:** rows sorted by PO Date, oldest first.

The Excel downloads follow the same order. Dates stay dd-mm-yyyy.

Note: Order Book uses the same table as Open Sales Orders and SIT, so it will also show oldest first.

## Technical details
- `sd-live-dashboard.tsx`: delete the Sales Mix Panel; let the Segment row grid fill 3 cards.
- `open-sales-orders-table.ts`: flip `sortOpenOrdersByCreationDate` to ascending (empty dates last); update its test.
- `open-po-dashboard.tsx` line 165: `a.poDate.localeCompare(b.poDate)`.
