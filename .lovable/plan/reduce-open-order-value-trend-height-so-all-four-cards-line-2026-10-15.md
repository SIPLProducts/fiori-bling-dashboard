# Reduce Open Order Value Trend height so all four cards line up

## Goal
In the row of four cards (Sales Document Type, Aging Bucket, Value Trend, LD Status), the Value Trend bar graph is too tall, so the other cards stretch to match and show empty space at their bottoms. Reduce the trend chart height so all four cards have equal, natural heights with no dead space.

## Current state (verified)
- The four cards share a row with `align-items: stretch`, so every card is as tall as the tallest one.
- The tall cards are the charts, not the data:
  - Value Trend canvas: 240px at the current window width (889px), 260px on wider screens (`src/styles.css` lines 680–682).
  - LD Status canvas: fixed 260px (`.order-ld-canvas`).
  - The two donut cards have shorter natural content (150px donut + small table), which is why their bottoms look empty.

## Changes
1. `src/styles.css`
   - Reduce the Value Trend canvas height from 260px to ~180px (and the ≤899px override from 240px to ~180px).
   - Reduce the LD Status canvas (`.order-ld-canvas`) from 260px to ~180px so it matches the trend card.
   - Keep `align-items: stretch` — once the chart cards shrink, the row height is set by the donut/table cards and no card has empty bottom space.
2. `src/components/open-sales-orders-dashboard.tsx`
   - No chart logic changes; the trend bars auto-scale to the new canvas height. The rotated X labels and value labels stay readable.
3. PDF export
   - Unchanged: PDFs keep their independent fixed geometry (250px canvases), so printed output is unaffected.

## Verification
- Browser check at the user's viewport (889×529) and a wide desktop size: all four cards same height, no empty bottom space, trend bars/labels still legible.
- `bun test` and build check.
