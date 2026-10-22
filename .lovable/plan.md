# SIT: 3 decimals on SIT Value, Highest Value and SIT LAH tiles

## Change
- On the SIT screen, the **SIT Value**, **Highest Value** and **SIT LAH** tiles show 3 decimals instead of 2.
  - Example: ₹26.54 Cr becomes ₹26.543 Cr (accurate to ₹1,000).
  - SIT LAH uses plain 3 decimals instead of the "whole number above .49" rule.
- Totals keep being added up from the full, unrounded SAP values (NETWR_TOT, TOT_AH), which are stored without rounding.
- Other SIT cards, the table, the exports and the other screens stay unchanged.

## Note on the ₹5 lakh gap
Rounding to 2 decimals can shift a shown figure by at most ₹0.5 lakh, so a ₹5 lakh gap likely comes from the data itself (date range, missing or extra lines). Share the SAP figure and date range, and I will compare.

## Technical details
- In `open-sales-orders-dashboard.tsx`, when `isSit`, format the three summary tiles with 3 fraction digits.
- Add a test that 265,432,100 is shown as 26.543 Cr.
