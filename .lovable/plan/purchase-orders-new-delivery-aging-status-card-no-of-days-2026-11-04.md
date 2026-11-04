# Purchase Orders: new Delivery Aging Status card (NO_OF_DAYS)

Add a new donut card "Delivery Aging Status" on the Purchase Orders screen, built from SAP's `NO_OF_DAYS` value for each line.

## What you'll see
- Donut with total value (Cr) in the middle and a table beside it: **Days / Val / %**.
- Bands same as Open Purchase Orders: **0–60, 61–180, 181–365, >365** days.
- Same glassy peach color, title underline, full-screen button and PDF inclusion as Open PO's aging card.
- Follows all screen filters; existing Delivery Status card stays.
- Placed in Row 1 after Delivery Status (row becomes 5 cards would crowd), so instead it goes in **Row 2 beside Plant Analytics and Monthly Trend** (three across).

## Technical details
- `purchase-orders-data.ts`: pure `poAgingBand(days)` helper + aggregation (INR-only Cr like other totals); blank/negative days go to 0–60.
- Dashboard: reuse exported `Donut`/`Card` from open-po-dashboard.
- Tests for band boundaries (60, 61, 180, 181, 365, 366).
