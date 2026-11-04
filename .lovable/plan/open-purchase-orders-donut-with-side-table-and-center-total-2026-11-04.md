# Open Purchase Orders: donut with side table and center total

- In PO Value by PO Type and Delivery Aging Status, the table (name, value in Cr, share %) moves back beside the donut, on its right.
- The total value in Cr is shown in the middle of each donut, with a small "Total" label above it.
- On narrow screens the table drops below the donut so the text stays readable.

## Technical details
- `Donut` in `open-po-dashboard.tsx`: change to `grid-cols-[minmax(0,9rem)_minmax(0,1fr)]`, stacking at small widths. Put an absolutely positioned center label over the chart showing `cr(total)`. Keep the legend text compact (`text-[10px]`) so it fits a quarter-width card.
