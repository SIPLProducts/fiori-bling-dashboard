# Current Stock: remove quantity tiles, simplify Stock Status

## Tiles
Remove Unrestr.stk (Q) and Stk in QC (Q). Remaining: Mat.price (V), Unrestr.stk (V), Stk in QC (V), in one row of three.

## Stock Status donut
Show only two slices: Unrestricted (SAP key WLABS, value) and Stk in QC (SAP key WINSM, value). Percentages are each one's share of their combined total.
(Quantity keys: LABST = unrestricted qty, INSME = QC qty.)

Table and Excel unchanged.

## Technical
- `src/components/current-stock-dashboard.tsx`: drop the two (Q) tile entries, grid `grid-cols-1 sm:grid-cols-3`; Stock Status data limited to unrV/qcV.
