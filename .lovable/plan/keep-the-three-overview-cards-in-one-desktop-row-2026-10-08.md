# Keep the three overview cards in one desktop row

## Changes
- Show **Open Orders by Sales Document Type**, **Open Orders by Aging Bucket**, and **Open Order Value Trend** side by side from 850px desktop width, including your current 949px screen.
- Give all three cards equal outer height and balanced widths, keeping the enlarged totals and readable labels.
- At narrower desktop widths, arrange each donut above its breakdown within its own card so the content fits without a horizontal scrollbar. Keep the document-type donut and table side by side on larger screens.
- Keep the two trend legend entries together on one line, right-aligned within the header. At compact card widths, the title may occupy a separate header line rather than overlap the legend.
- Keep phone layouts stacked and readable.

## Technical details
- Replace the current two-column desktop overview grid and full-width trend placement with a three-column grid.
- Use card-width-aware inner layouts rather than shrinking counts or squeezing the breakdown tables.
- Scope changes to these three screen cards; preserve all other cards, calculations, filters, Refresh, PDF, and Excel.

## Verification
- Check that all three card tops align in one row at 949px, 1280px, and larger desktop widths.
- Verify counts, labels, tables, and the single-line legend do not overlap or clip; check tablet and phone widths for page-width overflow.
- Provide an updated screenshot of the three-card row.