# Treemap equal-size tiles + Top customers / Segment "6 and 6"

## 1. Sales by Main Group (Amount) — balanced equal-size tiles

Replace the value-sized squarified layout (two huge tiles + tiny clipped ones) with an **even grid of equal-size tiles**:

- All tiles at a level are the same size, evenly distributed in a grid (e.g. 6 tiles → 3×2; adapts to the tile count and full-screen mode).
- Uniform font size for every tile name; amount and percentage lines also uniform.
- Name, amount (₹ Cr/L) and percentage shown **centered** in each tile; names wrap to two lines instead of truncating, with the hover tooltip as fallback for very long names.
- Consistent padding/gap between tiles for a clean, balanced look.
- Click behaviour unchanged: clicking a main group shows its sub groups (same equal-tile grid); sub-group tiles don't drill further; "Others" still drills into remaining main groups; breadcrumb "← All main groups" unchanged.
- Works the same in the normal card and full-screen view.

## 2. Top customers — show 6, tighter bars

- List shows the top **6** customers instead of 5.
- Reduce the row height/gap between bars so the six rows fit the card comfortably without excess empty space.

## 3. Sales by Segment (Amount) — show 6

- Donut and legend show the top **6** segments (remaining ones fold into "Others" as today, if present).

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - `MainGroupTreemap`: drop the `squarify` percentage-rect layout; render tiles in a CSS grid with equal cells (`gridTemplateColumns` derived from tile count, e.g. ≤2 → n cols, ≤4 → 2, else 3; rows = ceil(n/cols)). Centered flex column content per tile; `text-center`, name with `line-clamp-2`, single uniform font sizes; keep `title` tooltip, drill state and breadcrumb logic as-is.
  - Top customers: change the underlying aggregate slice from 10 → keep data, display 6 via the `BarList` items prop; reduce `BarList` row padding/gap (e.g. `space-y-2` → `space-y-1.5`, smaller bar height).
  - `SegmentDonut`: raise the segment limit from 5 to 6.
- `src/lib/sd-live.ts`: `topCustomers` slice stays ≥6 (currently 10 — sufficient).
- No data, query, or schema changes.
