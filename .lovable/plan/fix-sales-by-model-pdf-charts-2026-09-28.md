# Fix Sales by Model PDF charts

## Goal
Make every **Sales by Model (Amount & Per AH)** PDF page render consistently with the live dashboard, including blue amount bars, crore-scaled amount labels, model names, and per-AH values.

## Confirmed issue
The uploaded 12-page PDF shows model names and chart axes on pages 7–12, but the amount bars and their labels are absent. These model charts are mounted only for export and the PDF capture begins after two animation frames, while their bars still use chart animation.

## Changes
1. Disable bar animation for PDF model charts so each bar and amount label is fully drawn before capture.
2. Keep the live dashboard animation unchanged.
3. Wait for the export-only model charts to finish layout before starting page capture.
4. Preserve the current grouping of up to 10 models per page, widened model-label area, repeated HBL header, date range, and numbered footer.
5. Re-export the same filtered report and inspect every model page to confirm:
   - every model has a visible bar when its amount is non-zero;
   - amount and per-AH labels are readable and not clipped;
   - models appear once, in the same ranking/order as the dashboard;
   - no blank or cut chart pages remain.

## Technical details
- Pass the export state into the chart bar's `isAnimationActive` setting.
- Add a stable export-ready marker or layout wait before `exportDashboardPdf` captures the visual rows.
- Run the existing Sales Analytics tests and verify the final PDF visually page by page.
