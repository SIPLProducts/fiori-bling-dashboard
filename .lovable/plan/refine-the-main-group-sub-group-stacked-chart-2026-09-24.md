# Refine the Main Group → Sub Group stacked chart

## Changes

- Keep the existing Main Group view and click-to-drill behavior unchanged.
- In the drilled Sub Group view, tighten the horizontal layout:
  - use `barCategoryGap="10%"` or lower,
  - keep `barGap={0}` for stacked segments,
  - use a balanced fixed maximum bar width up to 60px while still allowing all Sub Groups to fit,
  - retain horizontal scrolling only when the complete live list cannot fit legibly.
- Improve tiny-segment interaction:
  - render very small non-zero values at a minimum visible height of 3px,
  - add a subtle chart hover cursor,
  - keep the tooltip focused on the exact segment under the pointer,
  - show Sub Group, PC Short Name, amount, record count, and percentage for that segment,
  - ensure small upper segments remain independently hoverable rather than merging tooltip values.
- Keep every Sub Group and PC Short Name produced by the filtered live data:
  - do not cap, aggregate, or replace low-value Sub Groups with an “Others” bucket,
  - retain zero-value categories and legend entries even when they cannot create a visible bar height,
  - keep Sub Groups sorted by amount,
  - give the complete division legend 16px top spacing, wrapping rows, and enough vertical space so labels are not clipped.
- Preserve the current 4-column / 8-column card layout, totals, expand action, filters, fiscal selections, colors, and live data behavior.

## Verification

- Add or update analytics tests proving zero-value, low-value, and numerous Sub Groups remain in the transformed data.
- Verify exact tooltips on BATTERY’s small top segments and small bars such as SMS, PEU, and OTHERS.
- Verify all Sub Groups and all PC Short Name legend labels remain visible at desktop and smaller widths.
- Run the focused dashboard tests and formatting checks.
