# Oldest date first in three tables

Tables: Open Sales Orders (Sales Order Creation Date), Sales In Transit (SIT Creation Date), Open Purchase Orders (PO Date).

## What you will see
- Rows run in full date order, oldest first: e.g. 28-12-2025, then 02-01-2026 ... up to the latest month.
- Rows with no date go at the end.
- The Excel download uses the same order as the table.

## Steps
1. Open each screen signed in and confirm the current order of the first and last pages.
2. Fix any table not in oldest-first order. Open Purchase Orders currently puts rows with no PO Date at the top; move them to the end.
3. Make each Excel download follow the table order.
4. Add a small check that a December row comes before a January row of the next year, and empty dates come last.

## Note
The previous update already sorts these tables oldest first in the preview. If the live site still shows another order, it needs the new version published/deployed to your server.
