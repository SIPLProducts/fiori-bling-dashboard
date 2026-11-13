# Radiant upload area and table header on Tables Master screens

This applies to all five Tables Master screens: Month Wise Upload, SAP MASTER, ZKEYRM, ZPC GROUP and Valuation Class Wise Subgroup. They will share one consistent look in the Tables Master rose colour, the same colour as their launchpad cards.

## What changes
- **Upload area:** the box with the Month/Year (or sheet) dropdowns, search and Upload button gets a soft rose wash from the top-left corner and a tinted border, matching the launchpad cards.
- **Table header:** the solid blue header row becomes a radiant rose gradient with white text. It stays fixed at the top while you scroll.
- **New Upload Excel button:**
  - a radiant gradient pill with a soft glow;
  - the upload icon sits in a small round badge, with a short "Excel .xlsx" hint below the label;
  - on hover the button lifts slightly and the glow gets stronger;
  - while uploading, a spinner shows with the progress text, such as "Uploading 200 / 500".
- **Unchanged:** the other buttons (Download, Edit, Delete), the rows, search and paging all stay as they are.
- This works in the Light, Dark and Glassy themes.

## Technical details
- Add these shared utilities to styles.css, all based on `--kpi-6` (the Tables Master accent):
  - `tm-panel`: radiant background and border;
  - `tm-thead`: the header gradient with `text-on-radiant`;
  - `btn-upload`: the gradient, glow and hover lift.
- Add a small `UploadExcelButton` component with the props busy, onClick and disabled.
- Use the utilities and the button in month-wise-upload-screen.tsx, master-table-screen.tsx and sap-master.tsx. Check the zrmmat, zpc-group and valuation-subgroup routes for their own upload buttons and update those too.
- No database changes.
