# Open Purchase Orders: rearrange card rows

- Row 1, four equal cards: PO Value by PO Type, Delivery Aging Status, Top 10 Vendors by Open Value, Top 10 Materials.
- Row 2, two equal halves: Plant Analytics and PO Value by Main Group.
- The Sub Group 1/2/3 row and the detail table stay as they are.
- Smaller screens stack the cards: two per row on tablets, one per row on phones.
- In the narrower donut cards, the legend sits below the donut so names and values stay readable.

## Technical details
- `open-po-dashboard.tsx`: row 1 uses `grid md:grid-cols-2 xl:grid-cols-4`, and row 2 uses `grid lg:grid-cols-2`.
- `Donut`: change to a stacked layout (`grid-cols-1`) so it fits a quarter-width card.
