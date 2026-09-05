# Top 10 Materials — same look as the other Top 10 cards

## What changes

The **Top 10 Materials** card currently uses a different layout (numbered badges with a thin progress bar and "records / %" footer). All the other Top 10 cards (Profit Centres, Customers, Sales Employees) use the compact bar-list style: one-line name, proportional blue bar, and amount on the right under an "Amount" header.

Update the Top 10 Materials card to use that same bar-list style:

- One-line material name, truncated with hover tooltip (same as profit centres).
- Proportional bar.
- Amount on the right with the compact ₹ Cr / L / K formatting.

## Technical notes

- `src/components/sd-live-dashboard.tsx`: in the Top 10 row, change the "Top 10 Materials" panel from `<RankedList items={analytics.topMaterials} total={totalRevenue} />` to `<BarList items={analytics.topMaterials} tone={2} />` (keeping a distinct accent colour from the neighbouring cards).
- `RankedList` stays in the file untouched (it may still be used elsewhere); no data or analytics changes — `topMaterials` already returns 10 items.
