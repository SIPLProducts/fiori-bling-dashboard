# Clear donut totals and single-line trend header

## Changes
- Enlarge the circles in **Open Orders by Sales Document Type** and **Open Orders by Aging Bucket**, giving the center count and label enough room without touching the ring.
- Use a clear, bold center count around 20–22px and a readable 11–12px label, with stronger contrast. Preserve the existing labels and all breakdown counts, values, and percentages.
- Keep the Sales Document Type circle on the left and its breakdown table on the right. Allow sufficient card width and height instead of squeezing the content.
- Place **Open Orders** and **Partial Delivered** together on one line at the right end of the **Open Order Value Trend** header, beside the title and above the divider. Match the legend markers to the plotted series colors.
- When three cards cannot fit readably, use fewer columns rather than shrinking text. On narrow phones, let the title wrap while keeping the two legend entries together and right-aligned in the header.

## Technical details
- Scope changes to these three cards in the Open Sales Orders dashboard and its screen styling.
- Replace the current 90px donut tracks with dimensions that accommodate the totals and labels; adjust the ring openings as needed.
- Remove the screen rule that forces the trend header into a single-column grid; use a width-aware header arrangement.
- Preserve every other card, filters, calculations, Refresh behavior, and PDF/Excel output.

## Verification
- Check the current 949 × 529 desktop view, larger desktops, tablets, and narrow phones for readable counts, unclipped labels, and no overlapping text.
- Confirm the trend legend remains a single line at the header’s right edge and its colors match the bars.
- Confirm totals remain unchanged and provide an updated dashboard screenshot after implementation.