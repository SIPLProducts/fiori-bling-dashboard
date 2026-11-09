# Current Stock tiles: separate Q and V, one row

## What changes
- Replace the 6 current tiles with 11 separate tiles, in this order:
  1. Unrestr.stk (Q)
  2. Unrestr.stk (V)
  3. Stk in QC (Q)
  4. Stk in QC (V)
  5. Restr.batch stk (Q)
  6. Restr.batch stk (V)
  7. Block.Stk (Q)
  8. Block.Stk (V)
  9. Blk stk ret(Q)
  10. Blk stk ret (V)
  11. Materials (count of unique materials)
- Every tile shows the total sum for its field across the filtered stock. (V) tiles show values in LAH. (Q) tiles show the plain quantity.
- All tiles sit in **one row**. The tiles are compact (smaller icon and text). If the screen is too narrow to fit all 11, the row scrolls sideways instead of wrapping onto a second row.
- No combined total anywhere. Charts, the table and Excel stay as they are now.

## Technical details
- Only `src/components/current-stock-dashboard.tsx` changes: the tile grid becomes a single `flex` row with `overflow-x-auto`, and each tile gets a fixed minimum width. It uses the same `Tile` component from the Open PO dashboard, without the `note` line.
- The totals already come from `stockTotals` (unrQ/unrV, qcQ/qcV, restrQ/restrV, blkQ/blkV, retQ/retV, materials).
- Q and V tiles for the same stock type share a color, so the pairs are easy to read.
