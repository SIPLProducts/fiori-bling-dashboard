# Add Pending Orders Against AH beside Open Quantity

## Requested result
- Add a summary tile titled **Pending Orders Against AH** immediately beside **Open Quantity**. Leave Quick View unchanged.
- Display the count of **distinct sales orders** having at least one line where **Total AH > 0**. Count each sales order only once, even when multiple lines qualify.
- Use the current Smart Filters, matching the other summary tiles. Table-only status, search, and pagination will not affect this count.
- Show **0** when no orders qualify. Exclude zero and negative Total AH values.
- Match the existing summary tile styling. Arrange the four summary tiles in one row where space allows and wrap on narrower screens without clipping the heading.
- Include the new tile in the PDF, consistent with the existing summary tiles. Leave Excel, other totals, and existing calculations unchanged.

## Technical details
- Use the already-loaded `order` and `totalAh` fields; no database, SAP mapping, or middleware changes are needed.
- Calculate the count from unique `order` values in filtered rows where `totalAh > 0`, through a small pure helper.
- Reuse the existing SummaryCard presentation and adjust the summary grid to accommodate four tiles without clipping the longer heading.

## Verification
- Test multiple qualifying lines from one order count as one, separate orders count separately, and zero/negative values do not qualify.
- Test decimal positive values, empty results, and filtered subsets.
- Check the tile count, its position beside Open Quantity, heading readability, and layout on screen and in PDF; preserve Quick View unchanged.