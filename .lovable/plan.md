# Sales In Transit: remove colour key under Month on Month

- Remove the coloured squares and Division names shown below the Month on Month chart, on screen and in the PDF.
- The bars stay split by Division with the same colours, and the month total stays on top of each bar.
- When you point at a bar, the tooltip still lists each Division with its colour, ₹ Cr value and invoices.

## Technical details
- `order-book-month-chart.tsx`: delete the `sit` legend div (line 39).
