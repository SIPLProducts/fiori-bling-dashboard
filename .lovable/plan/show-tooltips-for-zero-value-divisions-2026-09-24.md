# Show tooltips for zero-value divisions

## Change
- Keep zero-value PC Short Name divisions in the stacked chart and legend.
- Add a small invisible interaction area at the correct stack position when a division has records but its amount is zero.
- Hovering that area will show the exact Sub Group, PC Short Name, ₹0 amount, record count, and 0.0%.
- Preserve current bar proportions, colors, scrolling, spacing, and non-zero tooltips.

## Verification
- Verify a zero-value division such as DEFENCE ELECTRONICS → PCB displays its tooltip.
- Confirm non-zero tiny segments continue to show exact tooltips and chart totals remain unchanged.
