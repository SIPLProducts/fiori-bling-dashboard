# Main Group and Sub Groups on Purchase Register

Show the stored SAP groups (MNGRP1, PCGRP1, PCGRP2, PCGRP3) on Purchase Register the same way Open Purchase Orders shows them.

## What you will see
- **Filters:** new Main Group and Sub Group multi-select dropdowns in the folding filter panel.
- **Value by Main Group card:** same chart as Open PO ("PO Value by Main Group"), values in Cr, next to Plant Analytics.
- **Sub Group 1 / 2 / 3 cards:** one row of three cards, same style as Open PO.
- **Detailed table and Excel:** Main Group, Sub Group 1, Sub Group 2, Sub Group 3 columns.
- Lines with no group show as "Others" (same rule as Open PO).
- PDF includes the new cards (filters and table still excluded).

## Technical details
- `purchase-register-data.ts`: add `mngrp1,pcgrp1..3` to the select columns and row mapping (`mainGroup`, `subGroup`, `subGroup2`, `subGroup3`); bump query key so cached rows refetch.
- Reuse `OrderBookSubGroupChart` and the Open PO main/sub group aggregation helpers in the Purchase Register dashboard; filters use `FilterMultiSelect` (null = all).
- Totals/KPIs unaffected except through filters.
