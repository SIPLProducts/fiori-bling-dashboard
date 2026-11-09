# Current Stock tiles: 2 rows, smaller values

## What changes
- The 11 tiles sit in **2 rows**: 6 in the first row (Mat.price (V), Unrestr.stk Q/V, Stk in QC Q/V, Restr.batch stk (Q)) and 5 in the second. Sideways scrolling is removed.
- On smaller screens the tiles wrap into 3 columns (tablet) or 2 (phone), so values never get cut off.
- Tile values use a smaller font, so long numbers like 2,03,363.57 show in full. Labels stay fully visible.
- Order, colours and totals stay the same.

## Technical details
- In `src/components/current-stock-dashboard.tsx`, the tile row wrapper changes from `flex overflow-x-auto` to `grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2`. Tiles drop `min-w`/`flex-1`.
- The value text goes from `text-lg` to `text-sm` (`sm:text-base` on wider screens) with `truncate` and a title tooltip. Labels keep `text-[10px]` and wrap if they need to.
