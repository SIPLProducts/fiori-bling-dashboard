# Month Wise Stock launchpad card: ₹ Cr + types

On the launchpad, the Month Wise Stock card will:
- Show Total Inv Val in ₹ Cr (e.g. "₹ 13.62 Cr") across all uploaded months, matching the screen with no filter.
- List every type (Valuation Short Name, e.g. FG, Raw material, Ancillary…) under the total, each with its value in ₹ Cr, highest first, in small text. If the list is long, the top types are shown and the rest are rolled into "+N more".

## Technical
- `MonthWiseStockTile` in `src/routes/_authenticated/launchpad.tsx`: total/1e7 with 2 decimals; group rows by `type` (skip empty), sort desc, render as compact lines (reuse existing card layout, e.g. pass a list to the tile or render a small list inside it). Same shared query, so refresh-on-click behaviour is unchanged.
