# SIT: show 3 decimals on value and LAH figures

## What is true today
- Raw SAP values (NETWR_TOT, TOT_AH) are already stored with full precision, with no rounding when saved.
- All totals are added up from these full values. Rounding to 2 decimals happens only when the figure is shown.
- At 2 decimals in ₹ Cr, each shown figure can be off by at most ₹0.5 lakh. That alone cannot produce a ₹5 lakh gap, so the cause still needs to be found.

## Changes (SIT screen and SIT launchpad card only)
1. **3 decimals for SIT Value (₹ Cr) and SIT LAH**: tiles, chart labels and tooltips, the detailed table (AH (LAH) column and footer), Excel and PDF, plus the SIT launchpad card.
   - Example: ₹26.54 Cr becomes ₹26.543 Cr (accurate to ₹1,000).
   - On SIT, the LAH rounding rule (whole number above .49) is replaced by plain 3 decimals.
   - Order Book, Open Sales Orders, Net Sales and Cash Flow stay unchanged.
2. **Find the ₹5 lakh gap.** Compare the production SIT total against the SAP figure for the same date range. Look for missing or duplicate lines, the date filter, and plant/profit centre restrictions. Report the cause, and fix it if it is on our side.

## Need from you
- Which SIT tile shows the ₹5 lakh difference, the date range, and the SAP figure you compare against.

## Technical details
- Add a `decimals` option (3 when `isSit`) to the value/LAH formatters in `open-sales-orders-dashboard.tsx`, `order-book-subgroup-chart.tsx`, `open-orders-group-chart.tsx`, `plant-pending-chart.tsx` and `open-sales-orders-export.ts`. Give the SIT launch card a 3-decimal `formatValue`.
- Add a test that a SIT value of 265,432,100 is shown as 26.543.
