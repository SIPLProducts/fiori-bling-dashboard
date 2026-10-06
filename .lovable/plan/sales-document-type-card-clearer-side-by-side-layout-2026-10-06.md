# Sales Document Type card: clearer side-by-side layout

## Changes
- Place the donut circle on the left and its breakdown table on the right within **Open Orders by Sales Document Type**.
- Make the center count bold and clearly readable, with **Total Orders** directly beneath it. Give the donut hole enough space so neither overlaps the ring.
- Preserve the table’s Sales Document Type, Orders, Value (₹ Cr), and percentage columns, with readable headings and aligned numbers.
- Keep the surrounding dashboard layout, colors, filters, and calculations unchanged.
- On narrow screens, retain the left/right arrangement with horizontal scrolling where necessary rather than compressing or clipping the table.

## Technical details
- Replace the compact card’s forced single-column CSS with a dedicated two-column layout and stable donut dimensions.
- Remove this card’s desktop single-column override and adjust its donut center spacing without changing the other charts.
- Keep PDF spacing separate from compact screen spacing while preserving the circle-left/table-right order.

## Verification
- Check the card at the current preview width and wider desktop widths: readable center text, all table columns visible or accessible, and no overlap.
- Check a narrow screen and the PDF export for clipping and confirm totals remain unchanged.