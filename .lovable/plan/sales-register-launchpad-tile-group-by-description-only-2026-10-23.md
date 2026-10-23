# Sales Register launchpad tile: group by description only

Right now the tile makes one bar for each SAP code and description pair, so "Domestic Sales" appears three times (ZDOR, ZSOR, ZRE2), "Export Sales" appears three times, and ZDOR also shows as "Deemed Export Sales".

## Change
- Each bar is one description (VTEXT_DC): Domestic Sales, Export Sales, Deemed Export Sales, and so on.
- Lines and ₹ Cr values for every code that shares a description are added together. For example, Domestic Sales = 2,554 + 1,149 + 6 lines and ₹333.39 + ₹62.26 + ₹0.00 Cr.
- If a row has no description, its code is used as the label.
- Bars run from highest value to lowest. The tile total and line count stay the same.
- The Sales Register screen itself does not change.

## Technical details
- Change the grouping key in the Sales Register launch card summary from "AUART — VTEXT_DC" to the trimmed VTEXT_DC, falling back to AUART when it is blank.
- Add a test: ZDOR and ZSOR "Domestic Sales" rows combine into one bar with their lines and values summed.
