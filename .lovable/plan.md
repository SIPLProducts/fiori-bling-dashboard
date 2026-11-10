# Current Stock: four value tiles

## Changes
Tile row becomes four tiles, in this order:
1. **Current Inv Val** (new): Unrestricted + Stk in QC + Blocked values added together (SAP `WLABS + WINSM + WSPEM`), in Cr.
2. **Unrestricted val** (renamed from Unrestr.stk (V)), `WLABS`.
3. **Stk in QC val** (renamed from Stk in QC (V)), `WINSM`.
4. **Blocked Val** (new): `WSPEM`, red tile.

All follow the filters, show in Cr, and appear in the PDF.

## Technical details
- `src/components/current-stock-dashboard.tsx`: tile array updated; grid `grid-cols-2 lg:grid-cols-4`; uses existing `t.unrV`, `t.qcV`, `t.blkV`.
