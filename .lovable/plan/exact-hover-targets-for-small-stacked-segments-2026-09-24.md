# Exact hover targets for small stacked segments

## Changes
- Keep every visible bar segment proportional to its actual value.
- Add a transparent enlarged pointer target around each non-zero stacked segment in the drilled Sub Group chart.
- Resolve overlapping targets to the nearest real segment so PEU, OTHERS, INDUSTRIAL BATTERIES, IPS, LIB-ESS, and tiny BATTERY slices show only their exact details.
- Highlight the corresponding visible slice while its enlarged target is active.
- Preserve all current bars, scrolling, legend, totals, filters, and Main Group drill-down behavior.

## Verification
- Check exact tooltips on both normal and very small segments.
- Confirm each tooltip shows the correct Sub Group, PC Short Name, amount, record count, and percentage.
- Run the Sales Dashboard filter tests and inspect the chart at desktop width.
