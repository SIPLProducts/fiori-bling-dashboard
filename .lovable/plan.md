# Tables Master: one-row filter bar, new panel colour, two-colour header

Applies to Month Wise Upload, SAP MASTER, ZKEYRM, ZPC GROUP and Valuation Class Wise Subgroup.

## Changes
1. **One row on laptop/desktop screens (about 1024px and wider):** Month, Year, Search, the row count, Excel, Delete and Upload Excel all sit on one line.
   - Search shrinks to fit (it no longer stretches to push the buttons down).
   - The row count moves under Search as small text.
   - The buttons become slightly more compact, so all of them fit.
   - Tablets and phones still wrap neatly: fields on top, buttons below.
2. **Filter card colour:** the pale pink wash is replaced with a soft blue-to-teal radiant background and a matching border, so it suits the green and red buttons.
3. **Table header:** a clear two-colour radiant, deep blue on the left blending into teal/green on the right, with white text.
4. Check with screenshots at 949px, 1366px and 390px widths.

## Technical details
- In month-wise-upload-screen.tsx, master-table-screen.tsx and sap-master.tsx, the panel uses `flex flex-wrap lg:flex-nowrap items-end`. Search becomes `lg:w-56 xl:w-72 shrink`, and the button group becomes `shrink-0 lg:ml-auto lg:w-auto`. Buttons use `size="sm"` at lg.
- In src/styles.css, `tm-panel` changes to a blue→teal gradient over the card colour, and `tm-thead` changes to `linear-gradient(90deg, oklch(0.45 0.15 260), oklch(0.6 0.13 175))`.
