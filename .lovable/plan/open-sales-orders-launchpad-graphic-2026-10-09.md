# Open Sales Orders launchpad graphic

## Recommended design
Use compact horizontal bars like Net Sales rather than a donut. Bars leave more room for readable descriptions, order-line counts, and values on desktop, tablet, and phone.

## Changes
- Keep **Open Sales Orders**, the prominent total open value in **₹ Cr**, and the total **open order-line count**.
- Add a breakdown by Sales Document Type **description**, matching the report's description grouping.
- Each breakdown row shows its description, **order-line count**, **open value in ₹ Cr**, and a colored bar representing its share of total open value.
- Show the three largest descriptions by open value. If more exist, combine the remainder into an **Others** row so all counts and values are represented.
- Keep **Current FY Orders**, the financial-year/date caption, the last successful sync time in IST, and **View details**.
- Match the Net Sales card's tinted appearance and chart colors while supporting both light and dark modes. Allow labels and figures to wrap on smaller screens instead of clipping.

## Data and scope
- Preserve the card's existing active-snapshot scope: current April–March financial year through today in India, with ZDOR, ZEOR, and ZSOR.
- Count order lines, not distinct sales orders. Sum the stored open value without changing its calculation.
- Leave Net Sales, report screens, filters, PDF, Excel, SAP sync, and permissions unchanged.

## Technical details
- Extend the existing paginated launchpad read to include stored `sales_type` and `order_type` alongside `open_value`.
- Aggregate descriptions with the same fallback-to-code behavior as the report. Use a pure helper for counts, values, ranking, Others, and safe zero-total bar widths.
- Keep explicit-refresh behavior and use a distinct updated query key so older cached summaries cannot omit the new breakdown.
- Use existing semantic appearance tokens and card styles; no database changes are needed.

## Validation
- Test repeated order numbers counting as separate lines, shared-description grouping, exact value sums, Others reconciliation, and empty results.
- Verify breakdown counts and values sum to the card totals and agree with the report's opening period.
- Check readability at the current 901px desktop width, larger desktops, tablet, and phone in both appearance modes.
- Confirm the period, sync time, and View details remain visible and working.