# Different radiant colour per Tables Master card

Each Tables Master card on the launchpad gets its own radiant background colour, the same way the other modules do. Today all five cards share the same pink tint.

## What changes
- SAP MASTER, ZKEYRM, ZPC GROUP, Valuation Class Wise Subgroup and Month Wise Upload each get a different colour from the six shared launchpad accents. The colours repeat in order if more cards are added.
- The PP Overview card gets its own accent as well.
- Text sizes, the footer line and the radiant Open button stay as they are.
- This works in the Light, Dark and Glassy themes, because it uses the existing shared colours.

## Technical details
- `TableStatusTile` in tile-card.tsx gets an optional `accent` prop and passes it to `CompactTableTile`. The default stays 6.
- In launchpad.tsx, the Tables Master map passes `accent={(index % 6) + 1}`.
- `ZkeyrmTile` takes its accent from `tile.sort_order`, or from its position in the list.
- No database changes.
