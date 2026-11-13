# Radiant cards in every launchpad module

Every launchpad card in every module (Sales & Distribution, Purchase, Financial Accounting, Inventory and Production Planning) will get the Tables Master look:
- a soft radiant colour wash from the top-left corner, with a matching tinted border;
- the radiant **Open** button on the right;
- a different colour for each card in the same section.

## What changes
- **Plain cards** (the default card used by Inventory, Production Planning, placeholder and fallback cards) get the radiant wash and border in their own accent colour. The wide grey "Open Details" bar is replaced by the compact radiant Open button.
- **Custom module cards** (Net Sales, Purchase Register, Cash Flow, Order Book, SIT, Sales Register, and any others still on a flat background) get the same wash and border. Open Sales Orders, Open PO and Purchase Orders List already have it, so they stay as they are.
- **Colours:** within each section the cards rotate through the six shared launchpad colours, so neighbouring cards don't match.
- **Card content** stays the same: values, charts, bars and data don't change.
- This works in the Light, Dark and Glassy themes.

## Technical details
- Add one shared helper, `radiantTileStyle(accent)`, in tile-card.tsx. It returns the border colour plus `linear-gradient(160deg, color-mix(var(--kpi-N) var(--kpi-tint), tile) 0%, tile 70%)`.
- Use the helper in CardSurface, CompactTableTile, and every *-launch-card.tsx that still renders a plain `bg-launchpad-tile`.
- Change the CardSurface footer to a note on the left and a `btn-action` Open pill on the right.
- Pass `accent` down from TileCard, based on the card's index within its group, through to the custom launch cards. Cards without an index fall back to `sort_order`.
- No database changes.
