# Sales Dashboard main-group chart update

## Goal
Match the supplied reference more closely while keeping all Sales Dashboard filters and live data unchanged.

## Changes
- Place **Sales by Main Group (Amount)** and **Main Group vs Sub Group (Amount)** in one 12-column row, with each card occupying 6 columns on desktop.
- Stack the two cards vertically on smaller screens so labels and charts remain readable.
- Keep **Sales by Main Group (Amount)** as the existing interactive group view.
- Rebuild **Main Group vs Sub Group (Amount)** as a stacked column chart:
  - one column per main group;
  - one clearly differentiated color per subgroup;
  - subgroup legend below the chart;
  - compact rupee-value axis and readable angled main-group labels;
  - totals derived from the currently filtered live records.
- Add a polished tooltip showing main group, subgroup, amount, record count, and percentage contribution.
- Keep the existing expand control and make the expanded chart use the same stacked presentation with more room for labels.
- Use the dashboard’s semantic chart colors and neutral card borders; do not reintroduce colored left borders.

## Data behavior
- Build the stacked series from the existing `byMainGroup` and `subGroupsByMainGroup` analytics, which already use `main_group`, `sub_group`, amount, and record counts.
- Preserve Year, Quarter, sales-type, and all other dashboard filters; both cards update from the same filtered dataset.
- Show unassigned subgroup values explicitly instead of dropping them.

## Verification
- Confirm the desktop row is exactly 6 + 6 columns and mobile stacks cleanly.
- Verify stack totals equal each main-group total and tooltips show the correct subgroup values/counts.
- Check expansion, filtering, long labels, empty data, dark theme, and reduced-motion behavior.
