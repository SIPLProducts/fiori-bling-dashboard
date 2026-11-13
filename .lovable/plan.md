# Radiant cards in every launchpad module

Every launchpad card in every module (Sales & Distribution, Purchase, Financial Accounting, Inventory and Production Planning) will get the Tables Master look:
- a soft radiant colour wash from the top-left corner, with a matching tinted border;
- the radiant **Open** button on the right;
- one radiant colour per module, shared by all its cards. Each module has a different colour.

## What changes
- **Plain cards** (the default card used by Inventory, Production Planning, placeholder and fallback cards) get the radiant wash and border in their own accent colour. The wide grey "Open Details" bar is replaced by the compact radiant Open button.
- **Custom module cards** (Net Sales, Purchase Register, Cash Flow, Order Book, SIT, Sales Register, and any others still on a flat background) get the same wash and border. Open Sales Orders, Open PO and Purchase Orders List already have it, so they stay as they are.
- **Colours, one per module:** Sales & Distribution = blue, Purchase = teal, Financial Accounting = amber, Inventory = green, Production Planning = violet, Tables Master = rose. All cards in a module use that module's colour, including Tables Master (replacing its current mixed colours).
- **Card content** stays the same: values, charts, bars and data don't change.
- This works in the Light, Dark and Glassy themes.

## Technical details
- Add one shared helper, `radiantTileStyle(accent)`, in tile-card.tsx. It returns the border colour plus `linear-gradient(160deg, color-mix(var(--kpi-N) var(--kpi-tint), tile) 0%, tile 70%)`.
- Use the helper in CardSurface, CompactTableTile, and every *-launch-card.tsx that still renders a plain `bg-launchpad-tile`.
- Change the CardSurface footer to a note on the left and a `btn-action` Open pill on the right.
- Add a `MODULE_ACCENT` map from group key to a kpi accent number in launchpad.tsx. Pass `accent` from the section down through TileCard and TableStatusTile into the custom launch cards. Inner bar and chart colours stay as they are.
- No database changes.
