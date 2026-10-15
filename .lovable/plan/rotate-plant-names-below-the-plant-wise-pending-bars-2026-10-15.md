# Rotate plant names below the Plant-wise Pending bars

## What changes
- Plant names under the bars are shown **diagonally (−45°)** in the Plant-wise Pending card, instead of flat and cut short. Every plant keeps its position; names like "HBL VIZIANAGARAM" read in full rather than "HBL VIS…".
- The same diagonal names appear in the downloaded PDF, since both use this one chart.
- Bar values above each bar, the left ₹ Cr axis, the blue bars, the tooltip (name, code, Division(s), pending value, quantity, open orders) and all figures stay exactly as they are.

## What does not change
Filters, chart-only top-10 behaviour, summary tiles, every other card, the detailed table, Excel, and all calculations.

## Technical details
- `src/components/plant-pending-chart.tsx`: the bottom axis tick always renders `textAnchor="end"` with `rotate(-45)` (the current `dense` switch that only rotates when slot width is under 36px is dropped); the axis height grows to fit the longest plant name so nothing is clipped, and the truncation limit for rotated names is raised so long names fit instead of ending in an ellipsis. The full name remains in the tooltip.
- `src/styles.css`: the Plant-wise Pending canvas heights (currently 250 / 270 / 260px across the layout breakpoints) are raised slightly so the diagonal labels take space from the bottom margin rather than squeezing the plot.
- Verification: run the plant summary and plant-scale tests, check the preview at 889px and a wide desktop width for readable diagonal names with no clipping or overlap, and download the PDF to confirm the same diagonal names appear there. Inspect the build log.
