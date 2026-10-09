# Highlight the Open Sales Orders period on screen only

## Changes
- Remove the financial-year and From–To period text from the **Open Sales Orders PDF**, including its repeated header.
- Show the selected report period immediately **left of Refresh** in the Open Sales Orders screen header.
- Give the period a clear highlight using a tinted background, border, calendar icon, and readable bold text in both light and dark mode.
- For the current financial-year selection, display **FY 2026–27 · 01.04.2026 – 09.10.2026**, with the year and dates calculated dynamically rather than fixed.
- When dates change, show the actual selected range; when Date Range is cleared, show **All dates**. Do not label a custom range as the current financial year.
- Keep the period and Refresh/PDF controls together where space allows. On phones, wrap the header neatly without clipping the title, period, or buttons.

## Preserve
- Keep the last successful sync time below the title and excluded from PDFs.
- Leave launchpad cards, date filtering, current-FY opening/Reset, calculations, Excel, PDF colors, all cards, HBL headers, and numbered footers unchanged.

## Technical details
- Replace the existing PDF-only date label with a screen-only selected-period display in the report header.
- Use the existing date state, shared current-FY calculation, semantic appearance tokens, and PDF exclusion attributes.
- No database or SAP changes.

## Verification
- Check the highlighted period appears directly left of Refresh at the current 901px desktop width and wraps readably on tablet and phone.
- Verify date selection, Clear, and Reset update the label without changing report totals or filter behavior.
- Download the PDF, render and inspect every page, and confirm no FY, From–To period, or last-sync label appears; retain the HBL header and all report cards.