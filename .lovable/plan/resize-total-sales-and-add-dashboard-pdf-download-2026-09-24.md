# Resize Total Sales and add dashboard PDF download

## Dashboard layout
- Change **Total Sales (Amount)** to occupy 4 of 12 columns on desktop.
- Keep the card full width on smaller screens so its text remains readable.
- Leave the card’s calculations, click-through details, and other dashboard cards unchanged.

## PDF download
- Add a **Download PDF** button beside the existing **Filters** button in the Sales Dashboard header.
- Export the current filtered dashboard exactly as selected, including the dashboard heading, period, filter area and controls, active filter chips, sales-type selection, summary cards, and charts.
- Exclude only the **Net Sales List** table from the PDF.
- Generate an **A4 landscape** multi-page PDF and download it directly from the browser.
- Show a busy/disabled state while the file is being prepared, plus success or error feedback.

## Technical approach
- Mark the export boundary around the dashboard content before the table, rather than hiding the table after capture.
- Load the browser-only PDF and page-capture libraries only when the user clicks Download PDF, keeping normal dashboard loading and server rendering unaffected.
- Preserve the current theme colors and split long output across landscape pages without cutting content at the page edges.

## Verification
- Confirm Total Sales uses the 4-column desktop width and remains full width on mobile.
- Download the PDF from a populated, authenticated Sales Dashboard.
- Verify the PDF is landscape, contains the current filters/cards/charts, excludes the Net Sales List, and has no clipped or overlapping content.
- Run the existing Sales Dashboard tests and formatting/type checks.
