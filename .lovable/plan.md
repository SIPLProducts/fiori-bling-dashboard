# Current Stock: remove Transfer columns

## Changes
- Remove **Transfer (Q)** and **Transfer (V)** columns from the Stock Details table, its Total row, and the Excel download.
- Nothing else changes (cards and tiles already don't use Transfer).

## Technical details
- `src/components/current-stock-dashboard.tsx`: drop trfQ/trfV from `numCols` (totals array 6), remove both headers in table and Excel, table min width back to 1400px.
