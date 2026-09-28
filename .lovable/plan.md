# Improve Management Alerts

## Alert content
- Replace **Leading segment** with **Leading main group** so it adds a different business view from the existing Top profit centre alert.
- Calculate the leading main group dynamically from the currently filtered sales records.
- Show its name and percentage contribution to filtered sales, with “Sales amount grouped by main group” as the calculation basis.
- Keep Sales momentum, Customer concentration, Top profit centre, and Revenue per AH unchanged in purpose and preserve the compact 2–2–1 layout.

## Revenue per AH details
- Make the **Revenue per AH** alert visibly selectable with a clear details affordance and keyboard access.
- Open a focused monthly comparison popup using the latest two comparable months from the current filters.
- For each month, show:
  - local-currency sales amount
  - Total AH
  - Revenue per AH
  - posting count
- Show the exact change in local-currency Revenue per AH and the percentage movement between the two months.
- Use Indian number formatting and display full local-currency values so users can understand the alert without crore abbreviations.
- Show a clear unavailable state when the selected filters do not contain two comparable months.
- Recalculate the popup whenever dashboard filters change; do not introduce static values.

## Technical details
- Extend the live sales analytics result with structured alert identifiers and monthly Revenue-per-AH comparison values rather than parsing display text.
- Use the existing dialog and semantic color components for the popup.
- Keep all calculations sourced from the active filtered `zfisales_detail` rows and retain the existing positive-Total-AH eligibility rule used by Revenue per AH.

## Validation
- Add tests for Leading main group and monthly Revenue-per-AH values, including missing-month and zero-AH cases.
- Verify alert selection, popup values, filter updates, keyboard access, mobile fit, and application build.
