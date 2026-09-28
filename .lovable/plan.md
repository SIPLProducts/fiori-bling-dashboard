# Format Two Management Alerts in Crores

## Change
- Format the **Leading main group** sales value in crore scale with the `Cr` suffix, while keeping its group name and percentage contribution.
- Format the **Customer concentration** Top 5 combined sales value in crore scale with the `Cr` suffix, while keeping its percentage contribution.
- Use Indian number formatting with two decimal places and the rupee symbol, for example `₹125.40 Cr`.
- Do not change other Sales Dashboard values or alert calculations.

## Validation
- Update the Management Alerts tests for the new display text.
- Confirm both values and percentages render correctly and the application build passes.
