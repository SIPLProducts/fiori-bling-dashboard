# Export All Open Sales Order Business Fields

## Goal
Expand **Download Excel** so it exports every business field stored for the currently filtered Open Sales Orders, rather than only the 16 fields displayed in the table.

## Changes
- Load the remaining stored business fields needed for export without changing dashboard calculations, filters, or the visible detail table.
- Export these groups in a clear business order:
  - Order identifiers and dates: Order No., POSNR, preceding document, purchase order, document type, order date, purchase-order date, requested delivery date.
  - Sales structure: sales organization, distribution channel, division, plant/code and name, sales office, sales group, sales representative, profit centre, sales zone, region, country, and sales type.
  - Customer details: sold-to, bill-to, and ship-to codes and names, customer group, industry, and usage description.
  - Product details: material, description, material type, product category, model, range, and type.
  - Measures and status: ordered quantity, open quantity, delivered quantity, unit, currency, open value, days open, delivery status, and overall status.
- Continue exporting all rows matching the active screen filters, not only the current table page.
- Keep internal IDs, snapshot/sync fields, timestamps, hashes, and raw JSON out of the workbook, per the selected **All business fields** option.
- Preserve frozen headings, filters, professional formatting, date/number formats, and sensible column widths.

## Verification
- Confirm the workbook contains all filtered rows and every listed business column.
- Verify frozen headings and worksheet filters remain enabled.
- Recalculate and scan the workbook for spreadsheet errors, then inspect the header and representative records.
- Confirm the dashboard, table, filters, PDF, and Refresh behavior remain unchanged.
