# Material screen (Purchase Register screen 2) updates

## Changes
1. **Purchases by date table**
   - Plant column shows the plant short name (PLANT_SH), falling back to the plant code when no short name exists.
   - Date column shows DD-MM-YYYY.
2. **Layout**: Quantity bought chart and the Price by day/month/quarter/year table sit side by side in one row on wide screens (stacked on phones/tablets).
3. **Remove the "Show price changes of at least…" row** from the material screen.
   - The Price by day table then lists every period (still respecting "Hide periods with no purchase").
   - All chart dots show at full strength; the "X of Y periods shown" badge is removed.

## Technical details
- File: `src/components/material-price-page.tsx` only.
- Remove the minPct / minEffect state, filter strip and `periodPasses` usage in this page (the helper and its tests stay in `purchase-material-trend.ts`).
- Plant short name taken from the purchase row's `plant_sh` (already loaded in the Purchase Register dataset).
- Date formatting via a small DD-MM-YYYY formatter.
- No database or SAP sync changes.
