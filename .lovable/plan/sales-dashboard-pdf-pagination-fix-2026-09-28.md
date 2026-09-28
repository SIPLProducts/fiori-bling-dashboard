# Sales Dashboard PDF pagination fix

## Goal
Produce a clear A4 landscape PDF where cards are never cut between pages, oversized content continues cleanly, and every page carries the correct report identity.

## Changes
1. Replace fixed-height image slicing with card-aware pagination.
   - Measure the visible dashboard sections and card rows before capture.
   - Start a new page before a card or card row that cannot fit in the remaining space.
   - Keep related side-by-side cards together where they fit.

2. Add a repeated header to every PDF page.
   - HBL logo at the left.
   - Selected **From** and **To** dates at the right.
   - Remove “HBL MIS PORTAL” and “Sales Dashboard” beside the logo from the PDF.
   - Keep the on-screen dashboard unchanged.

3. Handle the oversized Sales by Model chart separately.
   - Split model rows into page-sized groups.
   - Repeat the chart heading and necessary axis context on continuation pages.
   - Ensure no model label or bar is divided between pages.

4. Preserve export-only exclusions.
   - Continue excluding Smart Filters, Data Available, Filters, and PDF controls.
   - Keep all dashboard figures and selected filter results unchanged.

## Technical details
- Extend the shared PDF exporter to accept repeatable page-header content and explicit break-safe blocks.
- Mark Sales Dashboard card rows and the model chart as PDF pagination units.
- Capture each page composition independently instead of cropping one continuous screenshot at arbitrary pixel positions.
- Retain A4 landscape sizing and consistent margins.

## Verification
- Export the same selected date range as the uploaded six-page example.
- Render every generated PDF page to images and inspect all page boundaries.
- Confirm every page has the HBL logo and From/To dates, no removed title text, no clipped cards, and clean model-row continuation.
- Verify the dashboard still renders normally on screen and the project build remains healthy.
