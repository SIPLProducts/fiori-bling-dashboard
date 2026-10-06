# Compact Sales Zone chart

Update only **Open Order Lines by Sales Zone**.

- Reduce the space between bars while keeping the bars narrow.
- Rotate zone names **45° diagonally** below the bars, with enough space to avoid clipping or overlap.
- Keep line counts above bars, without percentages, and values on the left.
- Apply the same compact arrangement to the PDF, keeping every zone visible.

## Technical details
- Reduce the chart’s per-zone width allowance from 72px to approximately 48px and set an explicit small category gap; retain the 32px maximum bar width.
- Replace wrapped zone ticks with end-aligned SVG text rotated −45°, increasing the bottom axis space as needed for the longest names.
- Keep horizontal scrolling when all zones cannot fit; use matching spacing calculations for screen and PDF.

## Verification
- Check narrow bar gaps, readable diagonal names, count-only labels, and unchanged tooltips on screen.
- Download the PDF and confirm all zone names and bars remain visible without clipping.