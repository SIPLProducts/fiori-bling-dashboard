# Fix Partial Delivered Bars in Open Order Value Trend

## Change
- Keep the three aging groups: **1–180**, **181–365**, and **>365 days**.
- Render **Open Orders** and **Partial Delivered** as separate side-by-side bars instead of stacking the partial amount above the total amount.
- Give both series distinct visible colors and value labels, so partial-delivery values remain visible even when much smaller than total open value.
- Preserve the current tooltip values and ₹ crore formatting.

## Validation
- Check the live Open Sales Orders screen and confirm Partial Delivered bars appear for 1–180 and 181–365 whenever their tooltip values are non-zero.
- Verify the chart remains readable on desktop and in the PDF export.
- Run the relevant tests and confirm the preview builds without errors.
