# Current Stock: header text and tile changes

## Files checked
The new API PDF and Excel sheet match the earlier ones (same 19 SAP keys and the same 19 Excel columns, 61 rows). Nothing changes in the API setup or the stored table.

## What changes
- **Remove** the line "Val in LAH · Sample sheet data (no SAP sync yet)" above the filters.
- **Header:** under "Current Stock", replace "Inventory" with "Val in LAH" (same style as "Val in Cr" on the purchase screens).
- **Tiles (still one row):**
  1. **Mat.price (V)** first: the total of the Mat.price of every stock line shown.
  2. Unrestr.stk (Q), Unrestr.stk (V)
  3. Stk in QC (Q), Stk in QC (V)
  4. Restr.batch stk (Q), Restr.batch stk (V)
  5. Block.Stk (Q), Block.Stk (V)
  6. Blk stk ret(Q), Blk stk ret (V)
  - **Remove** the Materials tile.

## Note
The SAP API does not send a material price. Until it does, each line's Mat.price is worked out as stock value ÷ stock quantity. The sample sheet uses its own Mat.price column.

## Technical details
- `src/routes/_authenticated/reports/inv/current-stock.tsx`: the ReportShell description becomes "Val in LAH".
- `src/components/current-stock-dashboard.tsx`: remove the sample/LAH paragraph. In the tile list, add `["Mat.price (V)", inr(sum of r.price)]` first and drop the Materials entry. The `sample` prop stays accepted but isn't shown.
