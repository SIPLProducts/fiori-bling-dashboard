# Remove tick boxes from ZKEYRM, ZPC GROUP and Valuation Class Wise Subgroup

## What changes
- The tick box column is removed from the tables on ZKEYRM, ZPC GROUP and Valuation Class Wise Subgroup, along with the "Delete selected" button that used it.
- Rows can still be deleted one at a time with the red delete icon on each row, and the whole upload can still be deleted with the Delete button. Edit stays the same.
- Month Wise Upload and SAP MASTER don't have tick boxes, so they stay as they are.

## Technical details
- `src/components/master-table-screen.tsx`: remove the checkbox `<th>`/`<td>`, the `picked` state, `allOnPage`, and the "Delete selected" button; fix the empty-row `colSpan`.
- Remove the unused `tm-check` utility from `src/styles.css`.
- Check the build log.
