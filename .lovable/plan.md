# Prevent Two-Year Quarter Bar Label Overlap

## Change
- When two financial years are selected, hide the numeric value labels above the monthly bars to prevent overlap.
- Keep both years’ grouped bars, financial-year legend, dynamic Y-axis scale, month labels, and axis titles unchanged.
- Keep each year’s exact monthly value and posting count available in the tooltip.
- When only one financial year is selected, continue showing the value directly above each bar.

## Validation
- Verify two-year charts have no overlapping bar labels and both series remain identifiable.
- Verify single-year charts still show values above bars.
- Run the Sales Dashboard tests and confirm the application build.
