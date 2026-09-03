# Treemap fixes: readable small tiles + "Others" drill-down

## What changes

### 1. Right-side small tiles are clipped / unreadable
Small rectangles (RAIL…, DEF…, the tiny ones) currently truncate the name and hide the amount/percentage because label sizing only has two modes (normal / "small").

- Label size becomes adaptive to each tile's actual size: font size and which lines are shown (name, amount, %) scale down smoothly as the tile shrinks instead of jumping to a tiny fixed 10px.
- Amount and percentage are still shown whenever the tile has room; on very small tiles the name is abbreviated (e.g. "RAIL…") but the amount is kept visible since that is what the user reads.
- Every tile keeps its hover tooltip (full name · amount · %) as a fallback.
- Slightly taller card body (260 → ~300px) gives narrow right-side tiles more room.

### 2. Clicking "Others" should show the remaining main groups
Currently clicking "Others" does nothing. Change it so:

- Clicking **Others** drills into the remaining main groups (all groups beyond the top 5), drawn as its own treemap, with a back link "← All main groups · Others".
- If there are still many remaining groups, show the top ones individually plus a nested "Others" tile that drills further — same behaviour at every level.
- Clicking a named main-group tile still drills into its sub groups as today.

No data, query, or schema changes.

## Technical notes

- `src/components/sd-live-dashboard.tsx` → `MainGroupTreemap`:
  - Track a drill path of levels instead of a single `selected` string: level 0 = top 5 + Others; level N = children of the chosen tile (sub groups for a named group, or next slice of main groups for "Others").
  - Add a helper `drillItems(level)` returning the items for that level plus whether a further "Others" tile exists.
  - Adaptive label: compute a tier from `Math.min(w, h)` (e.g. large ≥ 28, medium ≥ 16, small ≥ 8, tiny below); font sizes ~`Math.max(9, min(13, min(w,h) * 0.9))px`-style scaling, show amount line when `h >= 12`, percentage when `h >= 18`.
  - Increase default container height to 300px; full-screen mode unchanged (fills dialog).
