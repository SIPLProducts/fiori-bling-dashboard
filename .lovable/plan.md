# Current Stock – Stock Details total row and values in Cr

## What changes
1. **Values in Cr in the table:** Mat Price and every value column (Unrestr.stk (V), Stk in QC (V), Restr.batch stk (V), Block.Stk (V), Blk stk ret (V), Transfer (V)) show in Cr with 2 decimals. Quantity (Q) columns stay as plain quantities.
2. **Total row:** a bold Total row at the bottom of the table, summing every Q and V column across all filtered/searched lines (not just the current page). Mat Price total = sum of prices, shown in Cr, same as the tile.
3. **Column headers:** value headers get "(Cr)" hint via the existing "Val in Cr" label, names unchanged.
4. **Excel:** same treatment — value columns in Cr and a Total row at the end.

## Technical details
- File: `src/components/current-stock-dashboard.tsx` only.
- Use existing `cr()` for price and V columns, `inr()` for Q columns; totals computed once from `table` with a reduce.
- Total row rendered as a `<tfoot>` row; Excel adds a bold row and divides values by `CR` (rounded to 2 decimals).
