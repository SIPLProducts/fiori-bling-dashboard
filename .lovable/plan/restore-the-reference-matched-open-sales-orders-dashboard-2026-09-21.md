# Restore the reference-matched Open Sales Orders dashboard

## Goal

Rework the existing **Open Sales Orders** report so it closely matches the supplied reference screenshot again. The screenshot remains a visual reference only; it will not be embedded in the app.

## Screen structure

- Keep the compact report header with the title and supporting description.
- Match the reference’s dense six-filter row: Date Range, Sales Organization, Distribution Channel, Sales Office, Customer, and Sales Group.
- Match the six KPI cards with colored circular icons, prominent values, comparison indicators, and bottom sparklines.
- Preserve the reference’s exact content hierarchy:
  1. Open Sales Order Trend, Sales Zone donut, Sales Type donut.
  2. Profit Center bars, Main Group bars, Top 5 Customers table, Product Category bars.
  3. Detailed orders table and Key Insights panel.
- Tighten widths, heights, gaps, typography, chart proportions, table density, and panel alignment to closely reproduce the supplied desktop composition.
- Keep the layout responsive: preserve the same order while stacking cleanly on tablet and mobile without clipped charts or tables.

## Behavior and data

- Keep the current interactive sample Open Sales Orders dataset, as selected.
- Keep all six filters, the Value/Quantity/Both trend switch, chart tooltips, and detailed-table pagination functional.
- Keep the current protected route and screen permission check.
- Ensure the Open Sales Orders launchpad action continues to open this report directly.
- Do not modify the Sales Dashboard, launchpad, permissions, or SAP synchronization logic.

## Visual matching

- Use the existing enterprise blue shell and project design tokens.
- Reproduce the reference’s white compact cards, subtle borders and shadows, restrained corner radius, blue/green/purple/orange chart palette, and dense information layout.
- Remove excess outer whitespace by sizing the report content to the available viewport similarly to the reference.
- Compare implementation screenshots against the supplied image and iterate on visible differences in spacing, panel ratios, card dimensions, chart scale, and text hierarchy.

## Validation

- Verify filters, trend modes, pagination, and launchpad-to-report navigation.
- Compare desktop screenshots with the supplied reference and check tablet/mobile layouts for overflow.
- Confirm no browser console errors.
- Run the type check and formatting-diff validation.
