# Fix Quarter Tooltip and Multi-Year Quarter Status

## Tooltip
- Allow the monthly chart tooltip to extend beyond the chart and card instead of being cut at the bottom or side.
- Keep the tooltip within the visible screen and above nearby cards.
- Continue showing both selected financial years with each year’s exact value and posting count.

## Q3 and Q4 status
- For multiple selected financial years, determine whether a quarter is available from all selected years, not only the latest year.
- If FY 2025 has Q3/Q4 data while FY 2026 does not, keep Q3/Q4 visible and show the FY 2025 bars and values; the FY 2026 series remains empty.
- Do not label the whole card `Outside selected range` merely because the latest selected year has no rows.
- Use the latest selected year that actually has quarter data for the card’s displayed total and comparison status.
- Keep truly unavailable quarters hidden under the existing zero-total rule.

## Validation
- Verify FY 2025 + FY 2026 shows Q3/Q4 using FY 2025 values without an outside-range message.
- Verify the FY 2026 Q3/Q4 tooltip entries remain zero/empty while FY 2025 entries show their real values and counts.
- Hover every month near card edges and confirm the complete tooltip remains visible.
- Run the Sales Dashboard tests and confirm the application build.
