# Refine the Main Group and Sub Group chart interaction

## Default: Main Group view
- Keep the heading **Main Group vs Sub Group (Amount)**.
- Render one bar per Main Group, sorted from highest to lowest amount.
- Give each Main Group bar its own consistent color; do not split the default bars by division.
- Keep the current instruction and total amount above the chart.
- Clicking a Main Group opens its Sub Group view.
- The tooltip shows only the Main Group currently under the pointer, with its amount, record count, and contribution—not every stacked item together.

## Drilled: Sub Group view
- Change the heading to **Main Group → Sub Group (Amount)**.
- Show the selected Main Group as a small label directly below the heading, with the back action to return to all Main Groups.
- Render every Sub Group for that Main Group, sorted from highest to lowest amount.
- Use narrower bars and the available 8-column width; enable horizontal scrolling only when all Sub Groups cannot fit legibly. Do not replace Sub Groups with an “Others” bar.
- Keep each Sub Group broken down by its related PC Short Names (divisions), using consistent colors.
- Remove **Other Division** aggregation and expose every actual PC Short Name in the stacks and legend.
- Hovering a stack segment shows only that specific Sub Group + PC Short Name combination, with amount, record count, and contribution.

## Interaction and presentation
- Preserve the 4-column Main Group card and 8-column comparison card layout.
- Keep totals, expand action, filters, fiscal selections, and live-data behavior unchanged.
- Support long Sub Group names with readable shortened axis labels and full names in the tooltip.
- Keep the chart usable on smaller screens with horizontal chart scrolling rather than hiding data.

## Verification
- Confirm default bars use different colors and open the correct Main Group.
- Confirm the heading and selected Main Group label change after drilling down.
- Confirm every Sub Group and every PC Short Name is represented without forced “Others” aggregation.
- Confirm the tooltip contains only the hovered bar or segment.
- Confirm back navigation restores the original Main Group chart.
