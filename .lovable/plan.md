# Compact Plant-wise Pending without horizontal scrolling

## Changes
- Reduce space in **Plant-wise Pending only**; leave the rest of the dashboard unchanged.
- Fit all currently matching plant groups into the available card width instead of reserving 140px per plant and forcing a horizontal scrollbar.
- Reduce chart height from 330px to approximately 240–260px and tighten the gaps above the plot and below the plant labels.
- Replace the three-bar groups with **blue Pending Value bars** and an **orange Open Order Lines line with visible point markers**. Keep Pending Quantity in tooltips and the bottom total only, removing its bars and plot labels.
- Show a visible left vertical axis for **Pending Value (₹ Cr)** and a separate visible right axis for **Open Order Lines**, plus a visible bottom axis. Use actual numeric scales, not percentages or combined mixed-unit tick labels.
- Put the two-item legend in one compact area and remove the separate three-metric scale-heading row.
- Use narrow value bars and responsive gaps. Show plant codes below each group, with compact wrapped names where space permits and full names in tooltips.
- Label bars with pending value only and line points with order-line count. Place labels without overlap; show plant code/name, exact pending value, quantity, and line count in tooltips.
- Reduce the three bottom totals' padding, keeping their values prominent.

## Narrow widths and larger plant lists
- Keep every matching plant; do not remove plants or clip overflow to hide a scrollbar.
- When all groups cannot remain readable side by side, wrap them into additional compact chart rows rather than horizontal scrolling. Use the same scales across rows so comparisons stay consistent.
- This removes horizontal scrolling from the plant chart, not vertical scrolling from the entire dashboard.

## Technical scope
- Limit changes to plant-chart presentation and sizing helpers if required.
- Preserve actual-value calculations, blue value/orange count colors, Smart Filters, Refresh behavior, table totals, PDF, and Excel. Keep all three bottom totals, including quantity.

## Verification
- Check the current eight-plant dataset at the available preview width, standard desktop width, and narrow width.
- Confirm all plants are visible without horizontal scrolling, with visible axis lines, no overlapping bar/line labels, and no cut-off tooltips.
- Compare card height before and after and confirm the three totals remain unchanged.