# Open Purchase Orders: group cards, card order, separate group columns

## 1. Main Group and Sub Group 1/2/3 cards (same as Sales Register)
- Add a "by Main Group" card (wide) and three cards for Sub Group 1, Sub Group 2 and Sub Group 3, using the same stacked chart style as the Sales Register screen.
- Values: PO value in Cr, following the screen's current filters.
- Placed after the two analytics rows below.

## 2. Card order after the tiles
Row 1: PO Value by PO Type, Delivery Aging Status, Top 10 Vendors by Open Value, Top 10 Materials
Row 2: Plant Analytics, Daily PO Value Trend, Material Group Summary, Storage Location Distribution
- Four equal cards per row on wide screens (two per row on medium, one on phones).
- Purchase Group Overview is not in your list; it moves below these rows (tell me if it should be removed instead).

## 3. Detailed table and Excel
- Replace the single "Main / Sub Group" column with four separate columns: Main Group, Sub Group 1, Sub Group 2, Sub Group 3.
- Same four separate columns in the Excel download.
- Search also matches Sub Group 2 and 3.

## Technical details
- File: `src/components/open-po-dashboard.tsx` only; data already has `mainGroup/subGroup/subGroup2/subGroup3` from `mngrp1/pcgrp1/pcgrp2/pcgrp3` (no database change).
- Reuse `OrderBookSubGroupChart` with the same group/division summary helper used by `sales-register-dashboard.tsx`, dividing by plant (or PO type) as series.
- Grid changes: row 1 and row 2 each `xl:grid-cols-4`, all cards span 1.
