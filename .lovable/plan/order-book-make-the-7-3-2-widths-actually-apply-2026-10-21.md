# Order Book: make the 7 / 3 / 2 widths actually apply

## Why it still looks equal
A shared screen style for the Open Orders and Order Book layout forces this row into fixed column widths (4/3/3/2) on wide screens. That style overrides the 7/3/2 setting, so the three Order Book cards still look about the same width.

## Fix (Order Book only)
- Add an Order Book marker to the first chart row. Then add a style rule for that marker on screens 850px and wider: Month on Month gets 7 parts, Orders by Sales Document Type gets 3 and LD gets 2, out of 12.
- Below 850px, the row stacks as it does today.
- Open Sales Orders keeps its current layout.
- Check the result with a screenshot of the Order Book screen at desktop width.

## Technical details
- In `open-sales-orders-dashboard.tsx`, add the class `order-overview-book` to the overview row when `isBook` is true.
- In `styles.css`, add this rule after the 850px block:
  `.orders-compact .order-overview-row.order-overview-book { grid-template-columns: minmax(0,7fr) minmax(0,3fr) minmax(0,2fr); }`
  with `> * { grid-column: auto; }`
