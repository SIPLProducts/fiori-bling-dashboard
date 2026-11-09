# Current Stock: remove quantity tiles

Remove these five tiles from the Current Stock tile row: Unrestr.stk (Q), Stk in QC (Q), Restr.batch stk (Q), Block.Stk (Q), Blk stk ret(Q).

Remaining tiles (one row of 6): Mat.price (V), Unrestr.stk (V), Stk in QC (V), Restr.batch stk (V), Block.Stk (V), Blk stk ret (V).

Unchanged: table and Excel quantity columns, charts, PDF layout.

## Technical
- `src/components/current-stock-dashboard.tsx` lines 90-94: drop the (Q) entries from the tile array; grid stays `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`.
