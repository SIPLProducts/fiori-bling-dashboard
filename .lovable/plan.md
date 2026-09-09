# Real posting-driven Management Alerts

Replace the generic Management Alerts content with actionable alerts calculated from the currently filtered SAP postings and the equivalent previous date window.

## Alert calculations

- Keep the selected posting-date range and every active dashboard filter as the current comparison scope.
- Compare against the immediately preceding date range of equal length, using the same Sales Type, Segment, Customer, Profit Centre, Main Group, Plant, and Company Code filters.
- Generate a total-sales alert showing the period-over-period percentage and amount change.
- Compare customer sales by stable customer code, displaying the customer name:
  - highlight the largest meaningful decline,
  - highlight the largest meaningful gain or newly active customer,
  - identify a previously active customer with no current sales when applicable.
- Compare profit-centre sales by stable profit-centre code, displaying its short/name label:
  - highlight the largest meaningful decline,
  - highlight the largest meaningful gain or newly active profit centre,
  - identify a previously active profit centre with no current sales when applicable.
- Avoid misleading percentages when the previous amount is zero; describe these as “new in this period” instead.
- Rank negative changes first, then warnings and positive changes, cap the on-card list at five, and retain “View All” for the complete calculated list.
- Show a clear no-comparison message when the chosen dates have no usable previous-period postings.

## Presentation

- Keep the existing Management Alerts card position and compact corporate styling.
- Extend each alert with a category label (Sales, Customer, or Profit Centre), current-period amount, and comparison context where useful.
- Use semantic positive, warning, and negative colors/icons rather than hardcoded visual colors.
- Ensure long customer and profit-centre names wrap cleanly without breaking the card.

## Technical details

- Update `src/lib/management-live.ts` to build keyed current/previous customer and profit-centre maps from filtered `zfisales_detail` rows and produce deterministic ranked alerts.
- Extend the `ManagementAlert` type in `src/lib/management-data.ts` for category and optional supporting detail; remove reliance on the old static dummy alert list.
- Update `src/components/management/alerts.tsx` to render the richer real-alert shape with design tokens while preserving its dialog and “View All” behavior.
- No database or synchronization changes are required; alerts derive from the postings already loaded into the dashboard and therefore update immediately whenever filters or date ranges change.

## Validation

- Verify sales, customer, and profit-centre alerts against controlled current/previous posting samples, including zero-baseline, disappeared-entity, and no-previous-data cases.
- Open the authenticated Management Dashboard and confirm changing dates and business filters changes the alert text and values without console errors or layout overflow.
