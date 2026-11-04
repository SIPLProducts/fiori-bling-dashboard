# Open Purchase Orders polish + remove Division legend

1. **Collapsible filter card (Open Purchase Orders)** — add a header with a Show/Hide (chevron) button; filters stay applied when collapsed. Starts expanded.
2. **Light radiant card backgrounds (Open Purchase Orders)** — every card after the tiles (donuts, Top Vendors, Top Materials, Plant Analytics, Main/Sub Group charts, table card) gets a soft gradient background instead of plain white, using shared theme colors so Dark and Glassy themes still look right. PDF keeps the same look.
3. **Remove the "Division" color legend** under Main Group and Sub Group 1/2/3 charts on all screens (Open Purchase Orders, Open Sales Orders, Sales Register, Order Book/SIT/Net Sales). Bar colors and hover tooltips stay, so division names still show on hover.

## Technical details
- `open-po-dashboard.tsx`: `collapsed` state on the filter block; `Card` gets a gradient token class.
- `styles.css`: add a `--gradient-card-soft` token per theme.
- `order-book-subgroup-chart.tsx`: drop the `<Legend>` element (shared by all screens).
