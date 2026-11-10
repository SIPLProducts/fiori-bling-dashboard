# Rename group cards and skip empty groups (Purchase Register)

- Rename card headings: "Value by Main Group" → **Main Group**, "Value by Sub Group 1/2/3" → **Sub Group 1 / Sub Group 2 / Sub Group 3**.
- Lines with an empty Main Group or Sub Group are left out of that group's card and its dropdown (no more "Others"). Totals, tiles and other cards still count those lines.
- In the table and Excel, empty groups show blank.

## Technical details
- `purchase-register-data.ts`: map `mainGroup`/`subGroup` to the trimmed value with no "Others" default.
- `purchase-register-dashboard.tsx`: rename `CARD_TINT` keys and card titles; `grpRows` filters out rows with a blank key before `summarizeGroupsByDivision`.
