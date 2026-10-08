# Donut left, breakdown right in both overview cards

## Changes
- Keep **Open Orders by Sales Document Type**, **Open Orders by Aging Bucket**, and **Open Order Value Trend** together in one desktop row, including the current 949px view.
- In both donut cards, place the donut on the left and the breakdown table on the right—not above and below.
- Preserve the document-type descriptions, Orders, Value (₹ Cr), and percentage columns. Present the aging breakdown as aligned bucket, count, and percentage columns without adding new measures.
- Keep center totals and labels clearly readable. Allow descriptions and table headings to wrap, and use balanced donut/table widths rather than reducing text excessively.
- Keep equal outer card heights and the trend legend together on one line at the header’s right end.
- On phones, stack the three cards vertically while retaining the left/right arrangement inside each donut card. If the complete breakdown cannot fit, allow scrolling inside that card rather than clipping values or widening the page.

## Technical details
- Replace the narrow-card rules that currently stack the donut above its breakdown with dedicated two-column arrangements for these two cards.
- Scope screen changes to the overview cards in the dashboard and their styling; preserve the separate PDF layout.
- Keep all cards, filters, calculations, counts, Refresh behavior, detailed table, PDF, and Excel unchanged. No database or SAP sync changes.

## Verification
- Check the current 949px desktop width, wider desktops, tablets, and narrow phones for donut-left/table-right placement, readable totals, and unclipped breakdown values.
- Confirm all three cards remain in one row from 850px desktop width and the trend legend does not overlap its title.
- Verify unchanged totals and exports, and provide an updated screenshot of the three-card row.