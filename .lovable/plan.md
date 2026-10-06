# Distinct ranking colors and chart-header dividers

## Changes
- Give each ranking card a distinct bar color: **Customer — blue**, **Product — green**, **Model Wise — violet**. Keep bars within each card the same color for consistent comparison.
- Add a thin, full-width divider immediately below the heading inside these six cards:
  - Top 10 Open Orders by Customer
  - Top 10 Open Orders by Product
  - Open Orders by Model Wise
  - Open Orders by Sales Document Type
  - Open Orders by Aging Bucket
  - Open Order Value Trend
- Apply the colors and dividers on screen and in PDF export.
- Preserve existing layout, compact spacing, labels, values, filters, tooltips, and calculations. Leave other card headings unchanged.

## Technical details and verification
- Use existing semantic color tokens, with a per-card color option for the shared ranking chart.
- Add an optional header-divider setting to the shared panel, enabled only for the six requested cards.
- Verify distinct colors, readable headings, divider placement, smaller-screen rendering, and unclipped PDF output.