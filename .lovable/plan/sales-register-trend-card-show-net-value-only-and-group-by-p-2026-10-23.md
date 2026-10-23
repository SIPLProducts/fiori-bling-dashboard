## Sales Register trend card: show Net Value only and group by period

**What changes (Sales Register screen only)**
- Remove the "Invoice Value" bars from the card. Only **Net Value** (NETWR_TOT, ₹ Cr) is shown, as coloured gradient bars with the value printed on top.
- The grouping depends on the time span of the selected or filtered billing dates (FKDAT):
  - Up to 1 month: **weekly** (W1–W5 of each month, e.g. "Mar 26 W1")
  - More than 1 month, up to 1 year: **monthly** (e.g. "Apr 26")
  - More than 1 year (2, 3 years or more): **quarterly** (Apr–Jun = Q1 of the April–March FY, e.g. "Q1 FY26-27")
- The card title changes with the grouping: "Sales Register (Weekly / Monthly / Quarterly)".
- Tooltip shows the period and its Net Value in ₹ Cr.
- The span comes from the Billing Document Date filter when it is set. If it is not set, the span comes from the earliest and latest billing dates in the filtered data.

**Not changed:** the tiles, the other cards, the table, Excel, and the other screens.

### Technical details
- `src/lib/sales-register.ts`: add a pure `salesRegisterTrend(rows, range?)` that returns `{ granularity, points: {key, name, net}[] }` sorted oldest first. Use day difference: ≤31 means weekly, ≤366 means monthly, anything longer means quarterly.
- `sales-register-dashboard.tsx`: use a BarChart with Net only and pass the billingDate filter range from `dispatches.tsx`.
- Tests in `tests/sales-register.test.ts`: one for each granularity boundary, plus quarter/FY labelling.
