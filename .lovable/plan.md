# Remove “All order dates” from the PDF

- Hide the **All order dates** caption in the Open Sales Orders PDF when no date range is selected.
- Keep selected dates visible when a date range is applied.
- Preserve the HBL header, report title, charts, page numbering, and screen filters.

## Technical details
- Replace the default PDF date-label fallback with no label and render the date caption only when a selected date is available.
- Scope the change to the Open Sales Orders PDF header; leave other reports unchanged.

## Verification
- Export without a date selection and confirm the caption is absent on every page.
- Export with a selected date range and confirm the dates still appear without affecting header alignment.