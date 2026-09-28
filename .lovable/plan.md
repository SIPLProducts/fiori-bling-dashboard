# Show Amount Scale on Quarter Charts

## Change
- Display a left-side vertical amount axis on every visible Q1–Q4 monthly bar chart.
- Keep the values crore-scaled but show numbers only, without the `Cr` label, matching the current Sales Dashboard rule.
- Give the axis enough reserved width so tick values are not clipped.
- Use fewer, shorter tick labels on narrow screens so the month bars and count labels remain readable.
- Keep the existing month labels, count labels above bars, and exact value plus count in the tooltip.

## Validation
- Confirm positive, negative, and mixed monthly values use a sensible scale and zero baseline.
- Check desktop and mobile layouts for clipped labels, overlap, and horizontal overflow.
- Run the Sales Dashboard tests and verify the application build.
