# Aging Buckets: remove % column, add 365–730 and >730

## Changes

### 1. New aging buckets
- Replace the current three buckets with four:
  - **1 – 180 Days** (days open ≤ 180)
  - **181 – 365 Days** (181 – 365)
  - **365 – 730 Days** (366 – 730)
  - **> 730 Days** (above 730)
- The 4-slice donut, breakdown table, and value/partial totals all use the same bucket list, so they update automatically.

### 2. Open Orders by Aging Bucket card
- Remove the **% column** from the breakdown table (screen and PDF), leaving **Aging Bucket** and **Orders**.
- Adjust the table's column grid so the name and count align cleanly without the removed column.
- The card keeps its current size; the donut now shows 4 segments using the existing color palette (which already has enough colors).

### 3. Open Order Value Trend card
- The trend chart reads the same bucket list, so it automatically gains the two new groups (4 groups × 2 bars: Open Orders and Partial Delivered).
- To avoid scrolling: bars automatically shrink to fit the card width (they are capped and the chart is width-responsive), tick labels are shortened to `1–180`, `181–365`, `365–730`, `>730`, and the legend stays in the card header. No horizontal scroll is introduced.
- PDF export shows the same 4-group trend.

## Verification
- Confirm the four buckets count every filtered row exactly once (boundaries 180/365/730).
- Check the Aging Bucket card shows Bucket + Orders only, and the trend chart shows all 4 groups with both bars and value labels at the current screen size without scrolling.
- Run the existing Open Sales Orders tests and confirm the preview builds cleanly.
