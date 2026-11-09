# Current Stock: Cr values, Purchase-style filters and buttons

## What changes
1. **Values in Cr** – every value (tiles, donuts, bars, Plant Analytics, table and Excel value columns) is shown in ₹ Cr instead of LAH. Quantities and Mat.price stay as they are.
2. **Labels** – "Val in LAH" under the screen name and on card subtitles becomes **"Val in Cr"**.
3. **Filters like the Purchase module** – the same folding "Filters" panel (light card with arrow), the same small labels, and a Reset button in the row.
4. **Multi-select dropdowns** – Plant, Storage Location, Mat Type and Material become searchable dropdowns where you can tick several values (the same picker used on other screens). Nothing ticked = all.
5. **Header buttons like other screens** – Refresh (spinning icon), **Sync** (runs the Current_Stock SAP sync) and **PDF** (HBL header/footer, filters and table left out), placed in the header like Purchase Register.

## Technical details
- `current-stock-dashboard.tsx`: scale `1e7`, `cr()` formatter; filter state becomes `string[] | null` per field using the existing `filter-multi-select` component inside the open-po filter panel markup (TINTS.neutral, `data-pdf-exclude`, `variant="reset"`).
- Route `inv/current-stock.tsx`: description "Val in Cr"; actions = action-variant Refresh, `SyncNowButton endpointName="Current_Stock"`, PDF via `exportDashboardPdf` with `datedFileName("Current Stock","pdf")`; remove old outline Refresh.
- Update the existing current-stock test if it asserts LAH formatting.
