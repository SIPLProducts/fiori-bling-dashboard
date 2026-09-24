# Display every Sub Group PC Short Name in the stacked bars

## Confirmed issue
- The active INDL.BATTERY data contains all expected Sub Group and PC Short Name pairs, including BATTERY’s 7 divisions and DEFENCE ELECTRONICS’ SPI plus ₹0 PCB.
- The current chart enlarges tiny slices individually after their stacked positions are calculated. Very small and ₹0 slices occupy nearly the same edge, so later colors can cover earlier colors even though the records and tooltips exist.

## Changes
- Build separate display values for the chart so every recorded Sub Group + PC Short Name pair receives a distinct minimum visible slice.
- Preserve the real amount and record count separately; displayed slice height will never change tooltip values, totals, sorting, or filters.
- Keep combinations with no records absent, preventing unrelated colors from appearing in a Sub Group bar.
- Keep ₹0 recorded divisions visible with their assigned color and exact hover result, such as DEFENCE ELECTRONICS → PCB: ₹0 · 2 records.
- Remove the overlapping custom visual expansion that currently hides neighboring tiny divisions.
- Keep the enlarged exact hover targets, viewport-safe tooltip, horizontal scrolling, compact bars, legend, and drill-down behavior.
- Keep percentage removed from both Main Group and Sub Group tooltips.

## Verification
- Confirm BATTERY visibly contains VZNM, VNCPP, NCPP, NGN, NCFP, CS-SPT, and NGN BTY as seven distinct colored slices.
- Confirm DEFENCE ELECTRONICS visibly contains SPI and PCB, including the ₹0 PCB tooltip.
- Confirm INDUSTRIAL BATTERIES shows LI-ON and EDT, while PE, LIB-ESS, IPS, SMS, PEU, and OTHERS show only their recorded PC Short Names.
- Hover every tiny/zero slice and verify the tooltip contains only Sub Group, PC Short Name, actual amount, and record count.
- Run the Sales Dashboard analytics tests and inspect the drilled chart at desktop and narrow widths.
