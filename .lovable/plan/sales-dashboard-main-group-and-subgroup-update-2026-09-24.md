# Sales Dashboard main-group and subgroup update

## Goal
Make the two group cards a balanced 6 + 6 desktop row and match the supplied stacked-chart reference using live Main Group, Sub Group, PC Short Name, and Amount data.

## Layout
- Place **Sales by Main Group (Amount)** and **Main Group vs Sub Group (Amount)** in one 12-column row, each spanning 6 columns on desktop.
- Stack both cards vertically on smaller screens so chart labels remain readable.
- Keep neutral card borders with no colored left edge.

## Main Group vs Sub Group chart
- Rebuild the second card as a colored stacked column chart.
- At the all-groups level, show one column per Main Group, segmented by **PC Short Name** (the division).
- Clicking a Main Group drills into that group and shows its related **Sub Groups** as columns, still segmented by PC Short Name.
- Show a breadcrumb/back action such as **All main groups · selected group**.
- Use an aesthetic, accessible palette with one consistent color per PC Short Name and a legend below the chart.
- Tooltip details will show:
  - Main Group
  - Sub Group when drilled in
  - PC Short Name / Division
  - Amount
  - Record count
  - Percentage contribution
- Keep the total amount visible, support long labels, show unassigned values explicitly, and preserve the existing expand action.

## Live data
- Extend the current filtered analytics to aggregate **Main Group → Sub Group → PC Short Name**, including amount and record count.
- Keep Year, Quarter, sales type, and every existing dashboard filter connected to both cards.
- Do not add or duplicate database columns; use the existing `main_group`, `sub_group`, and `pc_short_name` values from `zfisales_detail`.

## Detail table
- Replace the combined **Main / Sub group** column with three separate adjacent columns:
  1. Main Group
  2. Sub Group
  3. PC Short Name (Division)
- Keep the separate Profit Centre column for its existing profit-centre value/name.
- Ensure exports and visible rows use the same separate columns.

## Verification
- Confirm desktop layout is exactly 6 + 6 and mobile stacks without overflow.
- Verify clicking each Main Group shows only its related Sub Groups and PC Short Name divisions.
- Verify stack totals match the filtered Main Group/Sub Group totals and tooltip amounts/counts.
- Check filters, back navigation, expansion, legends, long labels, empty data, and dark theme.
