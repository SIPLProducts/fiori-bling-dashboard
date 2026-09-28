# Prevent Quarter Tooltip Clipping

## Change
- Allow the monthly bar-chart tooltip to extend beyond the chart area and quarter card instead of being cut at the bottom or side.
- Keep the tooltip above nearby cards with a suitable display layer and constrain its width to the visible screen.
- Continue showing both selected financial years, with each year’s exact monthly value and posting count.
- Preserve the current bars, legend, axes, filters, and hidden two-year bar-top labels.

## Validation
- Hover Apr, May, and Jun bars near every card edge and confirm the complete second financial-year value and count remain visible.
- Check desktop and narrow screens for clipping or horizontal overflow.
- Run the Sales Dashboard tests and confirm the application build.
