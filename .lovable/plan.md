# Multi-select Year and Quarter filters

## Changes
- Replace the single-choice **Year** control with the existing checkbox-based multi-select control.
- Replace the single-choice **Quarter** control with the same multi-select pattern, retaining:
  - Q1: April–June
  - Q2: July–September
  - Q3: October–December
  - Q4: January–March
- Allow users to select any combination of available years and quarters. No selection means all values.
- Keep Quarter disabled until at least one Year is selected, matching the current filter flow.
- Update filter chips and Reset behavior for multiple selections.
- Apply OR logic within each filter and AND logic between them. Example: Years 2025 and 2026 with Q1 and Q2 includes Q1/Q2 rows from either selected year.
- Carry all selected years and quarters into report drill-downs so detail totals match the dashboard.

## Technical details
- Change the sales filter model from scalar `fiscalYear` and `quarter` values to string arrays.
- Update dashboard filtering, URL search validation, drill-down context, and legacy drill-down navigation defaults.
- Reuse the current `MultiSelect` control rather than introducing a new selector.
- Add focused tests for multiple years, multiple April–March quarters, combined filtering, and empty selections.

## Verification
- Select two years and two quarters and confirm all dashboard totals/charts update.
- Open a drill-down and confirm it retains the same selections and matching rows.
- Clear individual selections and use Reset to confirm the full dataset returns.
- Check desktop and narrow layouts for readable controls and selection summaries.
