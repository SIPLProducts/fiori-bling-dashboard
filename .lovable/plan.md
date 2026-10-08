# Keep Open Sales Orders PDF colors consistent

## Confirmed issue
The attached three-page PDF shows grey document-type segments and a grey quantity tile. The Open Sales Orders export applies the shared `pdf-export-theme`, which overrides the normal KPI/chart palette—for example, green becomes grey and violet becomes red. The PDF Sales Zone chart also uses a different color sequence and solid fills from the screen chart.

## Changes
- Preserve the report’s on-screen colors during PDF preparation: KPI tiles, donuts, legend markers, heading dividers, trend bars, rankings, status cards, and Quick View.
- Use the same category color sequence and radiant fills for Sales Zone in the PDF as on screen, retaining its existing PDF dimensions and labels.
- Keep white page backgrounds, readable text, repeated HBL headers, numbered footers, pagination, and all report calculations unchanged.
- Scope the correction to Open Sales Orders; do not change other reports’ PDF palettes or the normal screen layout.

## Technical approach
Separate the Open Sales Orders PDF layout safeguards from the shared palette overrides. Keep its existing export layout while inheriting the screen color tokens. Reuse the existing Sales Zone color/gradient helpers in its export-only chart.

## Verification
- Compare the same filtered report before download and during PDF preparation, checking matching colors for each category and series.
- Download a fresh PDF, render every page to images, and visually inspect colors, gradient fills, legends, text, and page boundaries.
- Confirm screen styling restores after export, values stay unchanged, and PDF/Excel downloads still work.