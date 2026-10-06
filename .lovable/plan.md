# Quick View border and Highest Value white content

- Make **all Highest Value content white**: both labels, the warning icon, the amount, and the customer details. Keep the yellow background.
- Add one visible outer border enclosing the **Quick View grey header and the three tiles beneath it**, with rounded outer corners and a divider below the header.
- Keep the blue, yellow, and violet tile backgrounds, existing content, calculations, and position unchanged.
- Apply these changes on screen and in the PDF.

## Technical details
- Reuse the existing white Quick View color token and semantic border tokens.
- Treat the border as a single section boundary, without adding extra nested card framing.
- Verify white text/icons, the enclosing border, and unclipped PDF output.