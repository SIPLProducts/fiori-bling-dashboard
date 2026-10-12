# Update Open Sales Orders charts

## Requested changes
1. **LD Status:** use radiant **red for Y** and **green for N**, on screen and in PDF. Preserve exact SAP status matching, values and line counts.
2. **Open Orders by Sales Document Type:** order descriptions by summed Open Value from highest to lowest, with the highest-value description first. Keep all descriptions, counts and percentages; use description order to break equal-value ties. Apply the same ordering in PDF.
3. **Sales Zone and Plant-wise Pending:** place the two cards side by side in one desktop row, including the current 951px view. Match their heights and keep clear axes, labels and tooltips. Stack them on narrow screens rather than compressing the charts.

## Top 10 and filters
- With Plant and Sales Zone unrestricted, show up to **10 zones ranked by order-line count** and **10 plants ranked by pending Open Value**. Each entry is an aggregated zone or plant, not an individual order row.
- Continue applying all Smart Filters before ranking.
- When a Plant or Sales Zone is explicitly selected, show all matching zone and plant groups in both cards, so selected groups are not hidden by the default Top 10 limit.
- Reset restores the default Top 10 views; selecting no values shows an empty result.
- Limit only the displayed charts. Keep summary totals, detailed-table rows, Excel and other cards based on the complete filtered dataset.
- Retain the PDF's separate full-width zone and plant blocks and complete filtered groups; do not copy the narrower screen geometry into exports.

## Technical details
- Reverse the semantic LD bar color mapping using status keys rather than array positions.
- Update the shared document-description aggregation sort.
- Add pure chart-selection helpers for default Top 10 versus explicitly filtered groups, retaining full aggregates for totals and PDF.
- Update the paired-chart grid and its existing CSS overrides; retain current value sources and sync behavior. No database migration or SAP changes.
- Update project preference notes to reflect the new colors, ranking and paired layout during implementation.

## Verification
- Test Y/N color-role selection, descending document-value ranking, 10-group limits, selected Plant/Zone combinations, empty selections and Reset behavior.
- Confirm chart truncation does not reduce dashboard totals or export rows.
- Check the paired charts at 951px and wider desktop sizes, plus stacked tablet/phone layouts, with readable labels and no page overflow.
- Download a fresh PDF to confirm reversed LD colors, descending document descriptions and preserved zone/plant export layout.
