# Daily Production: Top 10 Cost Center donut

- **Top 10 Work Centers** card is removed.
- **Production by Cost Center** is renamed **Top 10 Cost Center**. It becomes a donut like the old Work Centers card and takes its place beside Day Wise Production.
  - The list shows Cost Center name and Val (₹ Cr) only, with no % column.
- The row below keeps **Top 10 Materials Produced** and **Top 10 Scrap Materials** side by side, filling the width.
- PDF follows the same layout.

## Technical details
- `open-po-dashboard.tsx` `Donut`: optional `showPct` prop (default true); when false, hide the % header and values. Other screens unchanged.
- `daily-production-dashboard.tsx`: drop the `wcs` card; render `<Donut data={ccs} heads={["Cost Center","Val",""]} showPct={false} />` titled "Top 10 Cost Center"; second row `md:grid-cols-2`.
