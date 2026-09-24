# Align Total AH and AH Sales with the Net Sales List

## Confirmed baseline
- The live dataset contains **33,909 rows**.
- **13,460 rows** have `total_ah > 0`.
- Those rows total **642,371,668.96 Total AH** and **₹15,153,736,916 local amount**, which format to **6,423.72 L** and **₹1,515.37 Cr**.
- The row mapper already reads the database `total_ah` column into `totalAh`, and the Net Sales List export uses the same mapped rows.

## Changes
1. Build one explicit `qualifyingRows` collection from the currently filtered Net Sales List rows using parsed `totalAh > 0`.
2. Calculate both summary values from that same collection:
   - Total AH: sum `totalAh`, divide by 100,000.
   - AH Sales: sum `amount` without excluding negative amounts, divide by 10,000,000.
3. Format both values with exactly two decimal places using Indian number formatting and update the captions exactly to:
   - `Total AH > 0`
   - `Local currency amount where Total AH > 0`
4. Keep the CSV export and both tiles tied to the same active filtered rowset; no independent filter pass or use of the separate `ah` field.
5. Strengthen tests to verify the shared qualifying subset, inclusion of negative amounts, exclusion of zero/negative Total AH, and the full-data benchmark totals.
6. Verify the running Sales Dashboard with all filters cleared shows 33,909 table rows, 6,423.72 L, and ₹1,515.37 Cr.
