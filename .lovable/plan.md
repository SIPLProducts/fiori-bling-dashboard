# Refine Open Sales Orders Summary and PDF

## Confirmed mappings
- **Open Order Value:** change the SAP source mapping to `P_VALUE1`, save it in the existing database field `open_value`, and total filtered `open_value` rows in crores.
- **Open Quantity:** SAP `KWMENG_P` is saved in the database as `open_quantity`; the dashboard totals the filtered `open_quantity` rows.
- Keep the Open Quantity mapping unchanged. Existing rows will reflect `P_VALUE1` after the next successful Open Sales Orders sync.

## Changes
- Remove the **Average Days Open** summary tile from the Open Sales Orders screen and PDF.
- Reflow the remaining three summary tiles—Total Open Orders, Open Order Value, and Open Quantity—into a balanced responsive row.
- Keep aging calculations and Days Open information used elsewhere in the dashboard unchanged.
- Exclude the complete **Open Sales Orders – Detailed View (Aging Bucket)** section from PDF export while keeping it visible and paginated on screen.
- Keep **Download Excel** available in the detailed table and continue exporting all filtered business fields.
- Keep the document-type breakdown table in the PDF.

## Verification
- Confirm only three summary tiles appear on screen and in the PDF.
- Add mapping coverage for `P_VALUE1`, then confirm Open Order Value and Open Quantity reconcile to `open_value` and `open_quantity` for active filters.
- Confirm the detailed table remains on screen but is absent from the downloaded PDF.
- Verify the PDF pages remain unclipped and the Excel download still works.
