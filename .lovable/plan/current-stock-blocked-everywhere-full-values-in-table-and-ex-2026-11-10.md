# Current Stock: Blocked everywhere, full values in table and Excel

## Cards
- **Stock Status** donut: add a **Blocked** slice (`WSPEM`) next to Unrestricted and Stk in QC. Each % is out of these three.
- **Value by Mat Type, Top 10 Materials, Top Storage Locations, Plant Analytics**: these will add up Unrestricted + Stk in QC + Blocked, the same total as the Current Inv Val tile. Right now they also include Transfer, so the numbers will change a little.
- Top 10 Blocked card and Blocked Val tile stay as they are.
- Cards still show values in Cr.

## Stock Details table and Excel download
- Add **Block.Stk (Q)** (`SPEME`) and **Block.Stk (V)** (`WSPEM`) columns after Stk in QC.
- All value columns show the **full rupee amount** (not Cr), quantities as full numbers. The Total row does the same.
- The table card's "Val in Cr" label is removed.

## Technical details
- `src/components/current-stock-dashboard.tsx`: `cats` adds blkV; groupValue calls use unrV+qcV+blkV; `numCols` adds blkQ/blkV (totals array 8); table cells and Excel use `inr`/raw numbers instead of `/CR`.
