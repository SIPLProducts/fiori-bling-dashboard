# Show 3 decimals on all value and LAH figures

## What is true today
- Raw SAP values are already stored with full precision, with no rounding when saved.
- All totals are added up from these full values. Rounding to 2 decimals happens only when the figure is shown.
- At 2 decimals in ₹ Cr, each shown figure can be off by at most ₹0.5 lakh. That alone cannot produce a ₹5 lakh gap, so the cause still needs to be found.

## Changes
1. **3 decimals everywhere values are shown** (₹ Cr and LAH): tiles, chart labels and tooltips, Quick View, launchpad cards, the detailed table footer, Excel and PDF. This covers Net Sales, SIT, Order Book, Open Sales Orders and Cash Flow.
   - Example: ₹26.54 Cr becomes ₹26.543 Cr (accurate to ₹1,000).
   - The SIT LAH and Total LAH rounding rule (whole number above .49) is replaced by plain 3 decimals.
   - Excel value cells keep the full unrounded number.
2. **Find the ₹5 lakh gap.** Compare production totals against the SAP report for the same screen and date range. Look for missing or duplicate lines, the date filter, plant/profit centre restrictions, and which SAP value field is used. Report the cause, and fix it if it is on our side.

## Need from you
- Which screen and tile shows the ₹5 lakh difference, the date range, and the SAP figure you compare against.

## Technical details
- Add a shared `formatCr3` / `formatLah3` in `src/lib/format.ts`. Replace the 2-decimal formatters in the SD dashboard, launch cards, group/sub-group/month/LD/plant charts, the Cash Flow card and charts, `open-sales-orders-table.ts` and the exports.
- Update tests that assert 2-decimal output, and the tile-rounding test.
- Save the 3-decimal rule to project memory.
