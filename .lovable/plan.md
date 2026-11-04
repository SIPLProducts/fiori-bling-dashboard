# Revert Open PO card backgrounds

Return every card on the Open Purchase Orders screen (except the top tiles) to the earlier single soft blue-to-accent gradient used before the per-card colors (sky, peach, rose, copper, etc.).

## Keep unchanged
- Top tiles, card order/layout, donut tables and totals, full-screen buttons.
- Glossy bars and bolder labels (only the card backgrounds revert).

## Technical
- In `src/components/open-po-dashboard.tsx`, make `Card` always use one shared background: `linear-gradient(135deg, color-mix(in oklab, var(--primary) 10%, var(--card)), color-mix(in oklab, var(--accent) 14%, var(--card)))` with the default border, ignoring per-card `tint`. Apply the same to the Filters box and table section.
