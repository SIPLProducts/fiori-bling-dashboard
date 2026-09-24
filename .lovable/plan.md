# Keep exact-segment tooltips fully visible

## Issue confirmed
- The custom tooltip is positioned at a fixed 12px offset to the right and below the pointer.
- Its position is not adjusted near the right or bottom edge of the browser, so the tooltip can extend outside the visible screen, as shown in the screenshot.

## Changes
- Measure the tooltip after it renders and calculate a viewport-safe position from the current pointer location.
- Prefer showing it to the right and below the pointer.
- When there is insufficient space, automatically flip it to the left and/or above the pointer.
- Clamp the final position inside the visible browser area with a small margin.
- Give the tooltip a responsive maximum width and allow long labels and values to wrap cleanly.
- Recalculate while moving across segments and after horizontal chart scrolling.
- Preserve the enlarged exact-segment targets, exact Sub Group and PC Short Name values, chart scrolling, legend, and all chart data.

## Verification
- Hover the rightmost OTHERS segment and confirm the full tooltip remains visible.
- Hover upper BATTERY segments and confirm the tooltip stays below the top edge.
- Verify PEU, INDUSTRIAL BATTERIES, IPS, and LIB-ESS tooltips still report the exact segment.
- Check desktop and narrow widths, then run the Sales Dashboard regression tests.
