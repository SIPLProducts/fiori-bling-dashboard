# Show values on bar charts

Add numeric value labels directly on/near the bars in the charts that currently only show the bar shape, matching the reference screenshot.

## What gets changed

### 1. SD live dashboard horizontal bars
File: `src/components/sd-live-dashboard.tsx`
- Update the reusable `HBar` component so every bar displays its formatted value at the bar end (`position="right"` for horizontal layout).
- Keep labels readable: small font, compact currency formatting (`compact()`), muted foreground colour, and hidden when the bar is too short to avoid overlap.
- Charts affected:
  - Top customers
  - Any future panel using `HBar`

### 2. Procurement top suppliers bar chart
File: `src/routes/_authenticated/reports/procurement.tsx`
- Add `<LabelList>` to the "Top suppliers by spend" horizontal bar chart.
- Use the existing `money()` formatter and place labels at the right end of each bar.

### 3. Consistency check
- Verify that the Sales Analytics bar charts already have labels (comparison, dimension, segment). No change needed there unless labels are missing after review.

## Design notes
- Labels use existing semantic colours (`--color-foreground`, `--color-muted-foreground`).
- Font size stays small (10–11 px) so it does not crowd the chart.
- For horizontal bars, labels sit just outside the bar cap; if Recharts clips them, add a small right margin to the chart.

## Not included
- No data or schema changes.
- No new charts or filters.
