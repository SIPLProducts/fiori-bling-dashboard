# Launchpad: Sales & Distribution cards in one row + "Open Details"

## Change
- Sales & Distribution's 5 cards (Net Sales, SIT, Dispatches, Order Book, Open Sales Orders) sit side by side in one row on wide screens (laptop/desktop, 1280px and wider), each card narrower to fit.
- On smaller screens they wrap: 3 per row on tablets/small laptops, 2 on small tablets, 1 on phones, so the figures stay readable.
- Card content is tightened to fit the narrower width: slightly smaller main figure, bar labels wrap instead of overflowing.
- The "View details" button on every launchpad card is renamed to **Open Details** (SIT, Order Book, Open Sales Orders, Cash Flow and the standard cards), matching Net Sales.
- Financial Accounting and the other sections keep their current layout.

## Technical details
- `launchpad.tsx`: separate grid for `sales-distribution`: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`.
- `open-sales-orders-launch-card.tsx`, `net-sales-launch-card.tsx`: reduce value text size at xl, footer stacks (drop `min-[1100px]` two-column footer in favour of `2xl`).
- Rename "View details" text and aria labels in `open-sales-orders-launch-card.tsx`, `cash-flow-launch-card.tsx`, `tile-card.tsx`.
