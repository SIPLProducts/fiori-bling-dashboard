# Inventory Aging: remove Top 10 Storage Locations, add material-wise bucket cards

## What changes
- Remove the **Top 10 Storage Locations** card (screen and PDF).
- Replace the single "Top 10 Materials (>365 Days)" card with a row of four material cards, same style as the plant cards: **Material Wise >365 Days**, **181–365 Days**, **91–180 Days**, **0–90 Days**.
  - Same column graph and colours as the plant cards (red, gold, blue, green).
  - Top 10 materials by that bucket's value, highest first; materials with no value left out; "No data" when empty.
  - Material description below each column, full value in the tooltip.
  - Follow the screen filters and appear in the PDF as their own row.

## Technical details
- `src/components/so-ageing-dashboard.tsx`: drop `slocs` and the old `old` list; add `matBuckets = [3,2,1,0].map(i => ageGroup(data, r => r.matDesc, r => r.v[i]).filter(v>0).slice(0,10))`; render with existing `SingleColumns` in a `data-pdf-block` 4-column grid (md:2, xl:4).
