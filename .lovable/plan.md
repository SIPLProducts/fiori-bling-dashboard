# Align Total AH and AH Sales with the Net Sales List

## Result

Make both summary tiles reconcile exactly with the rows exported from the Net Sales List:

- Start with the same currently filtered rows shown in the Net Sales List.
- Keep only rows where **Total AH is greater than 0**.
- **Total AH**: sum the `Total AH` column from those rows and display it in Lakhs (`L`).
- **AH Sales**: sum `Amount in local cur.` from those exact same rows and display it in Crores (`Cr`).
- Count every stored/exported row once, including negative amounts when its Total AH is greater than 0.

With the current 33,909 stored rows, the verified values are approximately:

- Total AH: `642,371,668.96` = `6,423.72 L`
- AH Sales: `15,153,736,916` = `₹1,515.37 Cr`

These values will continue to update with the dashboard’s active filters.

## Technical details

- Replace the tile condition from the separate `AH > 0` field to `totalAh > 0`.
- Sum `totalAh` for Total AH and `amount` for AH Sales within that single shared row set.
- Update the tile captions so they explicitly reference `Total AH > 0`.
- Update the analytics tests to cover positive, zero, and negative Total AH values and verify that both totals use identical qualifying rows.
- Verify the displayed units and totals against the Net Sales List export calculation.
