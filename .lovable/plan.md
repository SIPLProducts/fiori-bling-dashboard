# Remove `Cr` from Two Management Alerts

## Change
- Keep **Customer concentration** and **Leading main group** amounts scaled in crores with the rupee symbol and two decimals.
- Remove only the visible `Cr` suffix, so values display like `₹2.50` instead of `₹2.50 Cr`.
- Preserve the customer/main-group names, percentages, alert calculations, and all other dashboard formatting.

## Validation
- Update the Management Alerts test expectations for both values.
- Run the focused sales dashboard tests and confirm the application build passes.
