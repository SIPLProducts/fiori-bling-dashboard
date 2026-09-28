# Improve Quarter Scale and Two-Year Comparison

## Quarter chart scale
- Show dynamic, rounded intermediate Y-axis tick values between zero and the highest monthly amount—for example `0, 50, 100, 150, 200, 250, 300`—rather than only `0` and the maximum.
- Calculate the tick interval from each chart's data range so smaller charts receive suitable steps such as `0, 5, 10, 15, 20`, while larger charts use larger rounded steps.
- Keep the axis title `Amount (₹)`, number-only crore scaling, visible axis lines, and the `Month` title.
- Allow negative monthly values by extending the scale below zero when required.

## Two selected financial years
- When two financial years are selected, show their monthly values as side-by-side bars for each month within Q1, Q2, Q3, or Q4.
- Use distinct dashboard colors and a clear financial-year legend so each bar is identifiable.
- Show the corresponding year's value above each bar when space permits.
- Show financial year, exact monthly value, and posting count in the tooltip.
- When one year is selected, retain the existing single-bar monthly view.
- Keep quarter totals, comparison percentages, partial-quarter handling, hidden zero-total quarters, and all other filters unchanged.

## Technical details
- Extend quarter trend data to carry a monthly series for each selected financial year while preserving the existing latest-year summary and comparison calculations.
- Use grouped chart series with a shared Y-axis domain and enough reserved space for intermediate tick labels.
- Keep labels responsive on smaller screens to prevent overlap.

## Validation
- Test single-year and two-year selections, monthly counts, zero-total quarter hiding, negative values, and partial quarters.
- Verify desktop and mobile charts for readable ticks, legends, labels, and tooltips.
- Run the Sales Dashboard tests and confirm the application build.
