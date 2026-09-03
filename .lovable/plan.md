# Dashboard card polish: treemap labels, Top customers, Segment card

## What changes

### 1. Sales by Main Group (Amount) — uniform tile labels
- All tile titles render at one consistent font size, like the reference screenshot, instead of each tile picking its own size.
- One shared font size for every tile's name (plus matching sizes for amount and %), computed once per view from the smallest tile so nothing clips.
- Long names on narrow tiles truncate with an ellipsis; hover tooltip shows full name · amount · %.
- Click behaviour unchanged: clicking a main group shows its sub groups; clicking a sub-group tile does nothing (no deeper levels). "Others" drills into remaining main groups; breadcrumb returns to "All main groups".

### 2. Top customers — 6 entries, tighter layout
- Show the top 6 customers instead of 10.
- Reduce the excess vertical spacing between bar rows so the card is compact.

### 3. Sales by Segment (Amount) — 6 segments
- Show the top 6 segments individually in the donut and legend; remaining segments are combined into an "Others" slice.

## Technical notes

- `src/lib/sd-live.ts`: `topCustomers: rank(byCust, 6)` (was 10).
- `src/components/sd-live-dashboard.tsx`:
  - `MainGroupTreemap`: replace per-tile tiny/small font tiers with one uniform size set derived from `Math.min` over the current rects (existing `pxW`/`pxH` estimates); keep `truncate`, tooltip, and `canDrill` drill logic as-is.
  - `BarList`: reduce row gap (`space-y-2` → `space-y-1.5`, full-screen `gap-2` → `gap-1.5`).
  - Segment panel: slice `analytics.bySegment` to top 6 and append an aggregated "Others" entry before passing to `SegmentDonut`.
- No schema, query, or data changes.
