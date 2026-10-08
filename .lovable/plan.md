# Compact Plant-wise Pending without horizontal scrolling

## Changes
- Reduce space in **Plant-wise Pending only**; leave the rest of the dashboard unchanged.
- Fit all currently matching plant groups into the available card width instead of reserving 140px per plant and forcing a horizontal scrollbar.
- Reduce chart height from 330px to approximately 240–260px and tighten the gaps above the plot and below the plant labels.
- Put the legend and scale headings in one compact area; narrow the left scale area while keeping actual currency, quantity, and line-count values clearly distinguished.
- Use narrower grouped bars and responsive gaps. Show plant codes below each group, with compact wrapped names where space permits and full names in tooltips.
- Keep bar values readable with collision-aware positioning rather than large fixed vertical offsets. Retain exact values in tooltips.
- Reduce the three bottom totals' padding, keeping their values prominent.

## Narrow widths and larger plant lists
- Keep every matching plant; do not remove plants or clip overflow to hide a scrollbar.
- When all groups cannot remain readable side by side, wrap them into additional compact chart rows rather than horizontal scrolling. Use the same scales across rows so comparisons stay consistent.
- This removes horizontal scrolling from the plant chart, not vertical scrolling from the entire dashboard.

## Technical scope
- Limit changes to plant-chart presentation and sizing helpers if required.
- Preserve actual-value scales, colors, calculations, Smart Filters, Refresh behavior, table totals, PDF, and Excel.

## Verification
- Check the current eight-plant dataset at the available preview width, standard desktop width, and narrow width.
- Confirm all plant groups are visible without horizontal scrolling, with no overlapping labels or cut-off tooltips.
- Compare card height before and after and confirm the three totals remain unchanged.