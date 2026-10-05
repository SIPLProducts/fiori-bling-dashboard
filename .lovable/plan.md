# Add Type limits to Model Wise Type

## Dashboard
- Rename the **Model Wise** card to **Model Wise Type**.
- Add **Top 10 Types**, **Top 20 Types**, and **All Types** tabs matching the existing Sales by Model controls.
- Default the card to Top 10 Types and keep the current horizontal chart, filters, tooltip, sorting, blank-value handling, and expand action.
- Keep both model cards at equal 6-column desktop widths and stacked on smaller screens.

## Data and PDF
- Retain the complete filtered Type ranking in the dashboard data so Top 20 and All Types can display beyond the current ten-item limit.
- Limit **Model Wise Type** to the Top 10 Types during PDF export, regardless of the selected on-screen tab.
- Keep Sales by Model at Top 10 for PDF and preserve the page-safe shared row, headers, date range, and footers.

## Validation
- Test Top 10, Top 20, and All Type limiting, ranking, counts, shares, and Unassigned handling.
- Verify the controls and chart at desktop and narrow widths, and confirm the selected screen limit returns unchanged after PDF generation.
- Export and inspect the PDF to confirm only the Top 10 Types appear without clipping, then run Sales/PDF tests, type checks, and confirm a clean preview build.
