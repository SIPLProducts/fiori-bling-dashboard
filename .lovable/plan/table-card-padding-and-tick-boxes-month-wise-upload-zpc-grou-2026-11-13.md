# Table card padding and tick boxes (Month Wise Upload, ZPC GROUP, Valuation Class Wise Subgroup)

## What changes
1. **Padding around the table** – the table inside the card gets breathing room (about 12px on all sides), with its own thin rounded border, so it no longer touches the card edges. The title bar and paging row get matching side padding.
2. **Tick boxes on ZPC GROUP and Valuation Class Wise Subgroup** – the tick boxes in the first column (used for "Delete selected") are made clearer: proper size, aligned to the row centre, coloured to match the theme, and the header tick box gets a "Select" tooltip so it's clear what it's for. Row delete icons stay as they are.
   - If you would rather remove the tick boxes completely on these two screens, say so and I'll drop them (row delete icon and "Delete" for all remain).
3. Same padding applied to ZKEYRM (uses the same table card). SAP MASTER unchanged.

## Technical details
- `src/styles.css`: add `tm-card-body` utility (padding 0.75rem, inner wrapper with border + radius 0.5rem, overflow-x auto); `tm-check` utility (h-4 w-4, accent-color primary, cursor-pointer, vertical-align middle).
- `src/components/month-wise-upload-screen.tsx` and `src/components/master-table-screen.tsx`: wrap the `overflow-x-auto` table container in `tm-card-body`; apply `tm-check` to checkboxes and add `title`.
- Verify build log.
