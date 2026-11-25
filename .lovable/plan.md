# Use the full screen width on every screen

On wide monitors, screens are capped at a fixed width (about 1400–1600 px), which leaves large empty bands on the left and right. The cap will be removed so content stretches edge to edge, keeping only a small even margin of about 12–16 px.

Applies to:
- Every report screen (Sales Dashboard/Net Sales, Dispatches, Open Sales Orders, Order Book, SIT, SO Ageing, Purchase, Inventory, Production Planning, FI, Tables Master, settings): the title bar, content and footer.
- Launchpad: module tabs and tiles.
- Open Sales Orders and Cash Flow, which have their own caps.

Unchanged: card sizes and rows (more space just widens them), phone layouts, PDFs and Excel.

## Technical details
- `report-shell.tsx`: drop `max-w-[1400px]` on header, main and footer; padding `px-3 sm:px-4`.
- `launchpad.tsx`: drop `max-w-[1500px]` (two places).
- `open-sales-orders-dashboard.tsx`: drop `max-w-[1600px]`.
- `styles.css` `.cash-dashboard`: `max-width: none`, side padding 16px.
