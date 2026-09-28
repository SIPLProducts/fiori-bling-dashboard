# Refine the Sales Dashboard PDF header

## PDF result
- Keep the on-screen Sales Dashboard unchanged.
- Exclude the complete **Smart filters** card from the downloaded PDF, including active-filter chips.
- Exclude the current **Data available**, **Filters**, and **PDF** controls from the PDF.
- Add a clean report header inside the PDF export area:
  - **HBL logo** at the top left;
  - the selected **From** and **To** dates at the top right;
  - use the dashboard’s effective date scope when either date is not explicitly selected, so the PDF always states the period it represents.
- Keep the dashboard title, summary cards, charts, all-model export behavior, and Net Sales List exclusion unchanged.

## Technical details
- Reuse the existing bundled HBL logo.
- Render the new report header only during PDF preparation so it does not alter the normal dashboard screen.
- Mark the existing dashboard controls and Smart filters section for PDF exclusion using the established export selector.
- Preserve the current A4 landscape, multi-page export and restore all temporary export state after success or failure.

## Verification
- Download a PDF with explicit From and To dates and confirm they appear at the top right.
- Download without explicit dates and confirm the effective report period is shown.
- Confirm the HBL logo is clear at the top left.
- Confirm Smart filters, Data available, Filters, PDF, and Net Sales List do not appear.
- Visually inspect every PDF page for clipping, overlap, spacing, and image quality, then confirm the preview build remains clean.
