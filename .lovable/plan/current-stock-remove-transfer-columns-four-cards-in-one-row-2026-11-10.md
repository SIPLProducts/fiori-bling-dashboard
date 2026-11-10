# Current Stock: remove Transfer columns, four cards in one row

## Changes
- Remove **Transfer (Q)** and **Transfer (V)** from the Stock Details table, its Total row, and the Excel download.
- Put **Value by Mat Type, Stock Status, Top 10 Materials, Top Storage Locations** in one row on wide screens. Smaller screens show them two per row.
- Top Storage Locations skips lines with no storage location. Top 10 Materials skips lines with no material description.

## Technical details
- `src/components/current-stock-dashboard.tsx`: drop trfQ/trfV from `numCols` (totals 6), remove headers, min width 1400px; grid `lg:grid-cols-4`; filter blank `sloc` / `matDesc` before `groupValue`.
