# Add Open Sales Orders exports and table fields

## Detailed table
- Add a **POSNR** column beside **Order No.**, using the stored sales-order item value.
- Change the **Product** column to **Product Description** and display the material description instead of only the material code.
- Keep pagination and horizontal scrolling intact.

## Excel download
- Add a **Download Excel** button in the detailed-table header.
- Export every currently filtered Open Sales Order row, not only the visible page.
- Include the detailed table columns in their displayed order, including POSNR and Product Description.
- Generate a formatted `.xlsx` workbook with clear headers, stable date/number formats, filters, and frozen headings.

## Dashboard PDF
- Add a **Download PDF** button beside **Refresh** at the top right.
- Reuse the Net Sales PDF structure: HBL logo, **HBL Engineering Limited** below it, repeated page header, confidentiality footer, and page numbers.
- Show **Open Sales Orders** as the report name in the PDF.
- Exclude the Smart Filters card and top action buttons from the PDF while retaining all currently filtered dashboard results.
- Export dashboard sections as page-safe blocks so cards and charts are not cut across pages.

## Validation
- Confirm POSNR and Product Description display correctly in the table.
- Verify Excel includes all filtered rows and the correct columns, independent of table pagination.
- Generate and visually inspect the PDF for repeated branding, omitted Smart Filters, complete charts/cards, readable labels, and clean page boundaries.
- Check Refresh remains manual, filters still affect all outputs, and the preview build has no errors.

## Technical details
- Reuse the existing dashboard export helper and HBL logo asset.
- Add client-side XLSX generation for the filtered detail dataset without changing database storage or SAP synchronization.
