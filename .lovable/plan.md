# Treemap labels: uniform font size across all tiles

## What changes

In the **Sales by Main Group (Amount)** treemap, all tile titles render at one consistent font size — like the reference screenshot — instead of each tile picking its own size.

- One shared font size for every tile's name (and matching sizes for the amount and percentage lines), computed once per view from the **smallest** tile: it picks the largest uniform size that still fits the tightest tile, so every tile matches and nothing clips.
- Long names on narrow tiles truncate with an ellipsis (e.g. "DEF.BATTE…") and the hover tooltip still shows the full name · amount · %.
- Amount and percentage lines keep appearing wherever the tile height allows, using the same uniform sizes.
- Click behaviour confirmed, no change needed: clicking a main group shows its sub groups; clicking a sub-group tile does nothing (no further levels exist). "Others" still drills into the remaining main groups, and the breadcrumb returns to "All main groups".
- Same behaviour in the normal card (300px) and full-screen view.

## Technical notes

- `src/components/sd-live-dashboard.tsx` → `MainGroupTreemap`:
  - Replace the per-tile `tiny/small` tier font selection with a single uniform size set computed from `Math.min` over all current `rects` (estimated px via existing `pxW`/`pxH`): e.g. name size chosen once, amount/% sizes derived from it.
  - Keep per-tile logic only for *hiding* the amount/% lines on extremely short tiles (height-based), while font sizes stay uniform.
  - Keep `truncate`, hover `title` tooltip, and existing drill logic (`canDrill` already blocks sub-level clicks).
- No data, query, or schema changes.
