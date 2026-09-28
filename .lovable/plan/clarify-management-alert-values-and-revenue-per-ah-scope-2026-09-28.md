# Clarify Management Alert Values and Revenue per AH Scope

## Correct the Revenue per AH comparison
- Select the latest two months in the current filtered data that each contain records with **Total AH greater than zero**.
- Do not reuse the Sales Momentum month pair, because those months can have sales but no eligible Total AH and currently cause the empty popup.
- Calculate each month from the same eligible records:
  - local-currency sales amount
  - Total AH
  - Revenue per AH
  - posting count
- Calculate the exact amount and percentage movement between those two eligible months.

## Make the selected scope clear
- Add a clear “Data scope” section at the top of the popup.
- When FY 2026 is selected, show **FY 2026–27 (1 Apr 2026–31 Mar 2027)** and indicate that records are limited by today or the selected end date.
- When no financial year is selected, explain that the popup uses all currently available filtered records through today, then names the two months being compared.
- Include any selected quarter/date restrictions in the scope text.
- If fewer than two eligible months remain, show which month is available and explain that one more positive-AH month is required, instead of showing only a generic unavailable message.
- Keep the popup fully dynamic when filters change.

## Add value and percentage to alert cards
- **Leading main group:** show the group name, its full local-currency sales value, and its percentage of filtered total sales.
- **Customer concentration:** show the combined full local-currency sales value of the top five customers and their percentage of filtered total sales.
- Keep both calculation-basis descriptions and avoid crore abbreviations in these alert values.

## Validation
- Test that Revenue per AH chooses the latest two positive-AH months independently of Sales Momentum.
- Test selected FY 2026 scope, no-year scope, quarter/date scope, and the one-month unavailable explanation.
- Test exact Leading main group and Top 5 customer values and percentages.
- Verify the popup on desktop/mobile and confirm the application build.
