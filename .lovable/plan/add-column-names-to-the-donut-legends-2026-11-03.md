# Add column names to the donut legends

On the Open Purchase Orders screen, add a small header row above the legend list in two cards:

- **PO Value by PO Type:** PO Type | PO Value (Cr) | Share %
- **Delivery Aging Status:** Days | Open Value (Cr) | Share %

The headers use small grey bold text with a thin line under them. They line up with the values below (names on the left, numbers on the right). Nothing else changes.

## Technical
- `src/components/open-po-dashboard.tsx`: `Donut` gets an optional `heads` prop (three labels) that renders a header row in the same flex layout as the legend items. Both cards pass their labels.
