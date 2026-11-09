# Current Stock: keep only Unrestricted and QC stock

## Tiles
Show five tiles: Mat.price (V), Unrestr.stk (Q), Unrestr.stk (V), Stk in QC (Q), Stk in QC (V).
Remove Restr.batch stk, Block.Stk and Blk stk ret tiles (Q and V).

## Stock Details table and Excel
Remove columns Restr.batch stk (Q/V), Block.Stk (Q/V), Blk stk ret (Q/V), including their Total row cells.
Keep Unrestr.stk, Stk in QC, Transfer and all other columns.

Charts and PDF unchanged otherwise.

## Technical
- `src/components/current-stock-dashboard.tsx`: tile array, table header/body/total row, Excel header/rows/total row.
