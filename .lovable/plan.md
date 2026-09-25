# Correct future and partial fiscal-quarter comparisons

## Quarter status rules

- Determine each April–March fiscal quarter’s exact start and end dates, then compare them with the selected `From` and `To` dates.
- Assign every visible quarter one clear status:
  - **Complete** when the selected range covers the full quarter.
  - **Partial** when only part of the quarter intersects the selected range.
  - **Outside selected range** when the quarter has no dates inside the selection.
- For `1 Apr 2026–25 Sep 2026`, show Q1 as complete, Q2 as partial through 25 Sep, and Q3/Q4 as outside the selected range.

## Correct comparison behavior

- Keep sequential April–March comparisons for eligible quarters: Q2 against Q1, Q3 against Q2, Q4 against Q3.
- For a partial quarter, compare its actual selected period with the equivalent elapsed-day window in the preceding quarter. For example, Q2 through 25 Sep compares with the same number of elapsed days from the start of Q1, rather than Q1’s full 90/91 days.
- Label partial comparisons clearly, such as **“Partial (Through 25 Sep) · vs same elapsed days in Q1”**.
- For Q1, retain the prior fiscal cycle baseline and rename the label to **“vs Prior FY Q4”**.
- Keep existing year-over-year behavior for multi-year or 18-month selections, but apply the same status handling so outside-range quarters never become artificial zero-value declines.

## Tile and analysis states

- Remove the **“Target not configured”** placeholder from Total Sales when no annual revenue target exists; keep the configured-target progress display unchanged.
- Outside-range quarter tiles will show **“Outside selected range”**, an amount placeholder `—`, no arrow, no percentage, no variance, and no misleading zero-value sparkline.
- Partial quarter tiles will retain the **Active** badge, add the exact **“Partial (Through DD Mon)”** sub-label, and identify that the percentage uses the same elapsed duration in the baseline quarter.
- Complete quarters continue showing their amount, trend, percentage, and variance normally.
- Apply the corrected states to **Quarterly Trajectory & Up/Down Variance Analysis**: outside-range quarters show a neutral placeholder row, while partial quarters use the same-elapsed-days baseline and display that scope clearly.
- Apply the corrected states to **Executive Insights**: exclude outside-range quarters from strongest/weakest results, decline callouts, increase counts, and average variance; describe partial-quarter insights as same-elapsed-days comparisons.
- Exclude outside-range quarters from active-quarter selection.
- Keep the PDF consistent with the corrected on-screen states.

## Technical details

- Extend the quarter summary model with an explicit status and selected-period label, and allow outside-range amounts to be absent instead of collapsing to zero.
- Calculate quarter/date-range intersections and map partial-quarter day offsets onto the immediately preceding fiscal quarter.
- Update the quarter cards, trajectory panel, and executive insights to use the status rather than inferring meaning from a zero amount or record count.
- No database or SAP sync changes are required.

## Tests and verification

- Add coverage for `1 Apr 2026–25 Sep 2026`: Q1 complete, Q2 partial, Q3/Q4 outside, with no `-100%` values.
- Verify partial Q2 uses the same elapsed-day portion of Q1 as its baseline.
- Test a partial range that begins or ends inside a quarter, missing history, zero baselines, Q1’s **Prior FY Q4** label, and multi-year comparisons.
- Confirm tiles, analysis, insights, desktop/mobile layouts, and PDF output all suppress false future declines.
