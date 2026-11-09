# Current Stock: remove quantity tiles

Remove the Unrestr.stk (Q) and Stk in QC (Q) tiles. Remaining tiles: Mat.price (V), Unrestr.stk (V), Stk in QC (V), in one row of three.

Table and Excel unchanged.

## Technical
- `src/components/current-stock-dashboard.tsx`: drop the two (Q) tile entries; tile grid `grid-cols-1 sm:grid-cols-3`.
