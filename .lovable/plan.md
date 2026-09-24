# Rename model-chart Total AH tooltip label

## Change
- In the **Sales by Model (Amount & Per AH)** tooltip, rename **Total Volume** to **Total AH**.
- Keep its value formatted in Lakhs AH.

## Confirmed count behavior
- **Total Orders / Records** already counts only the shared qualifying rows where `Total AH > 0`.
- Rows where Total AH is zero or negative remain excluded from the model amount, Total AH, realization rate, sales share, and record count.
- Active Sales Dashboard filters continue to apply before this qualification.

## Verification
- Confirm the tooltip displays **Total AH**.
- Confirm tests retain the positive-Total-AH-only record count behavior.
