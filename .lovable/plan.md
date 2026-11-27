# Inventory Aging: readable material names and slimmer bars on Material Wise cards

## What changes (all four Material Wise cards)
- **Material names visible:** each bar gets its material name under it, tilted so long names don't overlap. Very long names are shortened with "…".
- **Tooltip:** pointing at a bar shows the material code, full description and value in ₹ Cr.
- **Slimmer bars:** bars become narrower.
- The plant cards stay as they are, apart from the slimmer bars.

## Technical details
- `SingleColumns` in `src/components/so-ageing-dashboard.tsx`: add optional `angled` prop (XAxis angle -35, textAnchor end, height ~80, tick text truncated to ~18 chars), set `maxBarSize` to 28 for all cards.
- Group materials by code; carry description into the tooltip label.
