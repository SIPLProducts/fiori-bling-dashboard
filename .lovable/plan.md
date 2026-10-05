# Refine Open Sales Orders Summary and PDF

## Confirmed mappings
- **Open Order Value:** SAP `P_VALUE` is saved in the database as `open_value`; the dashboard totals the filtered `open_value` rows and displays the result in crores.
- **Open Quantity:** SAP `KWMENG_P` is saved in the database as `open_quantity`; the dashboard totals the filtered `open_quantity` rows.
- Keep both mappings unchanged.

## Changes
- Remove the **Average Days Open** summary tile from the Open Sales Orders screen and PDF.
- Reflow the remaining three summary tiles—Total Open Orders, Open Order Value, and Open Quantity—into a balanced responsive row.
- Keep aging calculations and Days Open information used elsewhere in the dashboard unchanged.
- Exclude the complete **Open Sales Orders – Detailed View (Aging Bucket)** section from PDF export while keeping it visible and paginated on screen.
- Keep **Download Excel** available in the detailed table and continue exporting all filtered business fields.
- Keep the document-type breakdown table in the PDF.

## Verification
- Confirm only three summary tiles appear on screen and in the PDF.
- Confirm Open Order Value and Open Quantity still reconcile to `open_value` and `open_quantity` for active filters.
- Confirm the detailed table remains on screen but is absent from the downloaded PDF.
- Verify the PDF pages remain unclipped and the Excel download still works.
