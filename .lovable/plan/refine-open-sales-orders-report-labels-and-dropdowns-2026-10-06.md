# Refine Open Sales Orders report labels and dropdowns

## Report labels
- Rename the page heading, report shell title, and PDF report title to **Open Sales Orders Reports**.
- Remove the description directly below the page heading.
- Rename **Document Type** to **Sales Document Type** in the filter, table headings, Excel headings, and document-type chart title/breakdown.
- Rename **Open Orders (Not Delivered)** to **Open Orders**, preserving its existing not-delivered calculation.
- Rename **POSNR** to **Line Item** on screen and in Excel, without changing the stored item key.
- Rename the detailed table heading to **Open Sales Orders Report – Detailed View (Aging Bucket)**.
- Preserve the existing rule excluding the detailed table from PDF; use **Line Item** wherever an item label appears in exported content rather than adding the table back.

## Dropdown labels
- Customer: **sold-to code — customer name**.
- Products: **material code — product description**.
- Division: **SPART code — VTEXT_DI description**, using the matching stored SAP response for each division.
- Sales Zone: display the **BEZEI description only**, as confirmed there is no zone code.
- Sales Document Type: retain the available SAP codes; do not invent descriptions absent from the stored response.
- Keep search, checkbox selection, Select All/Deselect All, Reset defaults, and filters unchanged.

## Date Range
- SAP **ERDAT** is stored in **open_sales_orders.order_date** and becomes **orderDate** in the report; the Date Range currently uses that value.
- Preserve that mapping and verify inclusive From/To filtering against ERDAT/order_date, including same-day ranges and missing dates.

## Technical details and validation
- Read the existing raw response only as needed for division labels; no database schema changes or SAP sync changes.
- Keep customer selections keyed by sold-to code and division selections keyed by division code.
- Update the report’s page metadata to the new report name.
- Verify all renamed labels, removal of the subtitle, dropdown code/description search, date filtering, Excel headers, PDF branding, and unchanged table exclusion.
