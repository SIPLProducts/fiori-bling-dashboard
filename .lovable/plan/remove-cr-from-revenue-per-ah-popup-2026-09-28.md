# Remove `Cr` from Revenue per AH Popup

## Change
- Keep each monthly **Sales amount** scaled in crores with the rupee symbol and two decimals.
- Remove only the visible `Cr` suffix, so values display like `₹9.51` and `₹10.25`.
- Leave Total AH, Revenue per AH, posting count, Movement, month selection, and calculations unchanged.
- Remove the popup-only labelled formatter if it becomes unused.

## Validation
- Confirm both month cards use the suffix-free crore-scaled format.
- Run the focused Sales Dashboard tests and confirm the application build passes.
