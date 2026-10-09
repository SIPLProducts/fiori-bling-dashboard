# Remove the period label beside Refresh

## Changes
- Remove the highlighted **FY and From–To date label** immediately left of Refresh in the Open Sales Orders report.
- Keep the report title, last synced time, Refresh, and PDF buttons neatly aligned across desktop, tablet, and phone.
- Keep the period absent from Open Sales Orders PDFs.

## Preserve
- Keep current-financial-year opening and Reset dates unchanged.
- Retain the editable Date Range inside Smart Filters, including Clear.
- Leave launchpad period captions, all counts, values, charts, Excel, PDF colors, and sync behavior unchanged.

## Technical details
- Remove the screen header period display and its now-unused formatting logic/imports.
- Update the saved presentation requirement to reflect that the period should not appear beside Refresh.

## Verification
- Confirm the FY/From–To label is absent beside Refresh and from the PDF header.
- Check header alignment on desktop and phone and confirm date filtering remains unchanged.