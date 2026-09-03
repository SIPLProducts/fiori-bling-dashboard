# Top customers + Sales by Segment: equal halves, all segments with paging

## What changes

### 1. Layout — two equal cards in one row
"Top customers" and "Sales by Segment (Amount)" sit side by side, each taking half the row width (6 + 6). Today Top customers takes two-thirds and the Segment card one-third, which is what squeezes the segment legend.

### 2. Sales by Segment — show all segments, paginated
- The card lists **all** segments instead of only the top 6 plus "Others".
- The legend shows a fixed number of rows per page (6). When there are more segments, small page controls appear under the legend ("1–6 of N", prev/next arrows).
- The donut always shows the full segment breakdown (every segment, no "Others" folding), and the total in the centre stays the overall total, so paging only changes which legend rows are visible.
- Legend colours stay in sync with the donut slice colours across pages.

### 3. Fix legend text running out of the card
- Segment name truncates with a hover tooltip; amount and percentage stay on one line and never overflow the card edge.
- Wider half-card plus a shrink-safe row layout keeps values like "₹2045.94 Cr · 51.6%" fully visible.

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - Panel grid: change "Top customers" from `lg:col-span-2` to `lg:col-span-3` (half of the 6-column row) and give the Segment panel `lg:col-span-3`, so both are equal halves on large screens and stack on mobile. Row container column count adjusted accordingly.
  - `SegmentDonut`: drop the `tileSlice(items, 6)` call; keep the full sorted list for the pie. Add local `page` state, `PAGE = 6`, slice the legend to the current page, and render prev/next buttons with an "x–y of N" label only when `items.length > PAGE`. Colour index uses the absolute item index so donut and legend match.
  - Legend row: keep `min-w-0` + `truncate` on the name and `shrink-0 whitespace-nowrap` on the value.
- No data, query or schema changes.
