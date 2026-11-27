# Inventory Aging: slimmer bars on Plant Wise Ageing

## What changes
- The **Plant Wise Ageing** chart (stacked by age group) gets narrower bars, matching the slimmer bars on the other plant and material cards.
- The **Profit Centre Wise Ageing** chart uses the same chart, so its bars become slimmer too.

## Technical details
- `BucketColumns` in `src/components/so-ageing-dashboard.tsx`: add `maxBarSize={28}` to each stacked `<Bar>`.
