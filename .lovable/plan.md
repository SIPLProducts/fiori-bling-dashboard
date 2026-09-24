# Correct Sub Group colors and compact chart labels

## Confirmed issue
- Active data contains only **LIB-ESS → LIB-ESS** (321 records) and **PE → PE** (2,590 records).
- The chart currently creates every global PC Short Name series for every Sub Group and applies a 3px minimum height, so missing zero-count series are painted as extra colors.

## Changes
- Draw a colored segment only when that exact Sub Group + PC Short Name combination has records.
- Keep recorded ₹0 combinations available through their invisible hover target and exact ₹0 tooltip, but do not paint unrelated zero-count divisions.
- Remove the global 3px painted placeholder behavior; retain the enlarged invisible targets so genuinely small non-zero segments remain easy to hover without distorting the stack.
- Reduce drilled Sub Group bars to the same compact maximum width as Main Group bars and tighten spacing.
- Keep every Sub Group in one horizontal chart row, sorted by amount, with horizontal scrolling when the full row exceeds the card width.
- Restore enough left chart margin and amount-axis width so every amount tick is fully visible in both Main Group and drilled Sub Group views.

## Labels
- Use the horizontal-axis bar labels for **Sub Groups**.
- Below the chart, add the label **PC Short Name** followed by division values such as VZNM, VNCPP, and NCPP in one non-wrapping row.
- Make that PC Short Name row horizontally scrollable when all division names do not fit.
- Keep the selected Main Group label, total, exact tooltips, colors, and back action unchanged.

## Verification
- Confirm LIB-ESS and PE each render only their one stored color.
- Confirm multi-division Sub Groups still show all genuine colors.
- Confirm a recorded ₹0 division still shows its exact tooltip without adding a visible false segment.
- Confirm compact Sub Group bars, complete labels, and horizontal scrolling at desktop and smaller widths.
- Confirm the left-side amount axis is not clipped in either chart state.
