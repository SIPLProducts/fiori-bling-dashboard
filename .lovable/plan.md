# Rebuild Open Sales Orders to match the attached dashboard

## Result
- Replace the current dashboard body with the same compact composition, hierarchy, card proportions, colors, and spacing shown in the reference image.
- Keep the existing portal shell, Open Sales Orders route, title, access permission, and launchpad destination unchanged.
- Treat the uploaded screenshot as a visual reference only; do not embed it in the application.

## Dashboard structure
1. **Top row — four summary cards**
   - Total Open Orders
   - Open Order Value
   - Open Quantity
   - Average Days Open
   - Match the reference’s tinted backgrounds, colored circular icons, large values, and period-change captions.

2. **Middle row — three analytics panels**
   - Open Orders by Aging Bucket: donut with `1–180 Days`, `181–365 Days`, and `>365 Days`, showing count and percentage.
   - Open Order Value Trend: stacked bars for Open Orders and Partial Delivered, including values, axis labels, legend, and tooltips.
   - Open Orders by Sales Zone: horizontal colored bars with count and percentage labels.

3. **Bottom row**
   - Open Orders (Not Delivered) status card.
   - Partial Delivered Orders status card.
   - Quick View panel with Longest Aging, Highest Value, and Highest Quantity.

## Data behavior
- Calculate every card, chart, percentage, and Quick View item from the existing Open Sales Orders dataset rather than copying the screenshot’s example numbers.
- Extend the sample records only where needed to represent not-delivered and partial-delivery quantities for the new design; keep this isolated so live SAP data can replace it later.
- Preserve correct Indian number and currency formatting and keep chart tooltips within the viewport.
- Remove the current six-card KPI row, Smart Filters, extra trend/type/profit-centre/group/customer/category panels, detailed table, and insights panel so the page matches the supplied composition.

## Responsive behavior
- Preserve the reference’s dense three-row desktop layout at wide sizes.
- Stack cards and panels in the same reading order on tablet and mobile without clipped labels, charts, or horizontal overflow.

## Validation
- Compare the finished desktop screen directly with the uploaded reference for layout, spacing, panel ratios, colors, typography, and icon treatment.
- Verify all totals and percentages reconcile with the displayed dataset.
- Check desktop and mobile screenshots, chart tooltips, console errors, tests, type validation, and the preview build.
