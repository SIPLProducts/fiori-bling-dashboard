# Tables Master launchpad cards: smaller text, radiant Open button

Applies to the 5 Tables Master cards (SAP MASTER, ZKEYRM, ZPC GROUP, Valuation Class Wise Subgroup, Month Wise Upload). Other modules' cards are unchanged.

## Changes
- **Main value smaller**: "27 rows" / "No data uploaded" drops from the big 26px heading to a compact ~16px semibold line, so "No data uploaded" fits on one line.
- **Last updated + button on one row**: the footer becomes a single row — "2 sheets · Last updated 30 Oct 2026, 05:…" (or "Tables Master" when empty) in small text on the left, and a compact **Open** button with arrow on the right.
- **Radiant button**: the Open button uses the same radiant `btn-action` style as the Purchase Orders List / Sales cards, replacing the pale full-width "Open table" bar.
- **Card background**: same soft radiant tint as other module cards.

## Technical
- Add a `compact` variant to `TableStatusTile` in `src/components/tile-card.tsx` (own small layout using `btn-action`, `--kpi-*` gradient background); launchpad Tables Master branch passes it. Use it also for the ZKEYRM tile so all five match.
- No data or database changes.
