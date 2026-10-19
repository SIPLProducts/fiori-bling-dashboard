# Order Book: Month on Month card and four-card row

Applies to the Order Book Report screen and its PDF only. Open Sales Orders stays unchanged.

## Layout
- Right under the summary tiles, one row of four equal cards:
  1. **Month on Month** (new)
  2. Open Orders by Sales Document Type
  3. Open Orders by Main Group
  4. Open Orders by Sub Group
- **LD** moves to the next row, beside Orders By Zone and Plant-wise order received.
- On smaller screens the four cards drop to 2 per row, then 1. Charts get a little narrower so they fit.

## Month on Month card
- Vertical bars of Order Value (₹ Cr) for each order created month, oldest to newest (e.g. Apr 26, May 26).
- The tooltip shows the value and how many distinct orders there are.
- The card follows the Smart Filters and each user's Plant access, the same as the other cards.

## Technical details
- Add a pure helper that groups filtered rows by the `orderDate` month: it sums value and counts distinct orders. Add a test for it.
- Add a small Recharts bar chart component for the card. For the PDF, give it fixed sizing.
- In the dashboard, when `isBook` is true, restructure the overview, LD, and group rows into: row of 4 (lg:grid-cols-4), then LD, Zone and Plant.
- Make the Sales Document Type card compact enough to fit a quarter-width column.
