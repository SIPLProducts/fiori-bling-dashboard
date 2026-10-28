# Net Sales Segment: use KDGRP_DESP

## Why local works but Quality/Production don't
- Net Sales Segment card reads the `business_segment` column. Locally that column happens to be filled; on Quality/Production it is empty.
- When it is empty, the card falls back to the profit-centre `segment` column, which holds codes like PSGR3000 / LEGR2000. That's what your screenshot shows.
- SAP's KDGRP_DESP (Railways, Industry, Defence...) is actually stored in the `customer_group` column on every environment. Sales Register works because it reads `kdgrp_desp` directly.

## Fix
1. `src/lib/sd-live.ts`: add `customer_group` to the selected columns; map to `customerGroup`.
2. Segment = `customerGroup` (KDGRP_DESP) first, then `businessSegment`; no fallback to profit-centre codes. Blank = left out of the donut (same as Sales Register).
3. Apply the same value to the Segment filter, table Segment column, CSV/PDF.
4. Bump Net Sales query key (e.g. `v4-kdgrp`) so cached data is replaced.
5. Add a small test: KDGRP_DESP label used; PSGR-style segment code never shown.

No database change is needed — the data is already stored.
