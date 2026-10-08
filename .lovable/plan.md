# Add Pending Orders Against AH to Quick View

## Requested result
- Add a third Quick View tile titled **Pending Orders Against AH**, keeping Longest Aging and Highest Value.
- Display the count of **distinct sales orders** having at least one line where **Total AH > 0**. Count each sales order only once, even when multiple lines qualify.
- Use the current Smart Filters, matching the other Quick View tiles. Table-only status, search, and pagination will not affect this count.
- Show **0** when no orders qualify. Exclude zero and negative Total AH values.
- Use the existing violet tile styling with a white count. Keep all three tiles readable, side by side where space allows and stacked when needed.
- Include the new tile in the PDF, consistent with the existing Quick View tiles. Leave Excel, other totals, and existing calculations unchanged.

## Technical details
- Use the already-loaded `order` and `totalAh` fields; no database, SAP mapping, or middleware changes are needed.
- Calculate the count from unique `order` values in filtered rows where `totalAh > 0`, through a small pure helper.
- Reuse the existing Quick View presentation and adjust its grid to accommodate three tiles without clipping the longer heading.

## Verification
- Test multiple qualifying lines from one order count as one, separate orders count separately, and zero/negative values do not qualify.
- Test decimal positive values, empty results, and filtered subsets.
- Check the tile count, heading readability, and layout on screen and in PDF; preserve the other Quick View tiles.