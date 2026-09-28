# Remove Crore labels and add data-driven quarterly bar charts

## Amount labels

- Remove the visible `Cr` / `Crores` suffix wherever crore-scaled values appear in the Sales Dashboard, including summary cards, quarter values and variances, analysis values, chart axes, tooltips, and dynamic insight text.
- Keep the existing crore scaling and Indian number formatting; only remove the unit text. Preserve `₹` where it is currently part of the display unless that specific card already uses number-only formatting.
- Do not change Lakhs, thousands, percentages, per-AH values, or values outside the Sales Dashboard.

## Dynamic quarter visibility

- Show Q1, Q2, Q3, or Q4 only when its filtered total is not zero.
- Hide a quarter when its filtered total equals zero, including quarters whose positive and negative postings net to zero, as selected.
- Continue respecting the active fiscal-year, date, quarter, Profit Centre, Segment, Customer, sales-type, and search filters.
- Apply the same visible-quarter set to the summary row and the Quarterly Trajectory & Up/Down Variance Analysis section, with a clear empty state if no quarter remains.
- Reflow the remaining quarter cards automatically across the available width.

## Quarter monthly bar charts

- Replace each quarter card’s mini trend line with a compact three-month bar chart in fiscal order:
  - Q1: Apr, May, Jun
  - Q2: Jul, Aug, Sep
  - Q3: Oct, Nov, Dec
  - Q4: Jan, Feb, Mar
- Extend each monthly point with its filtered posting count.
- Show the month, crore-scaled value without `Cr`, and posting count in the tooltip.
- Display the posting count directly on each bar when space permits; on narrow cards, keep it available in the tooltip and suppress labels that would overlap.
- Keep negative values visually correct and preserve exact values in tooltips.

## Technical details

- Extend the quarter trend data produced by `buildQuarterSummaries` with monthly record counts.
- Filter zero-total quarter summaries before rendering the cards and variance analysis.
- Use the existing chart library, dashboard color tokens, and responsive layout; do not change comparison calculations or filter behavior.

## Verification

- Add tests for zero-total quarters being hidden, non-zero quarters remaining visible, and monthly amount/count aggregation.
- Verify all four fiscal month sequences, negative monthly values, selected-quarter filtering, and the all-empty state.
- Confirm no visible `Cr` or `Crores` suffix remains in the Sales Dashboard while crore scaling remains unchanged.
- Check desktop and narrow layouts, tooltips, bar-label overlap, PDF export, and the application build.
