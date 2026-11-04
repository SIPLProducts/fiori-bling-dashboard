# Open Purchase Orders: colored backgrounds on every card except tiles

- Make the soft gradient clearly visible: a stronger blend of the theme's main and accent colors, not near-white.
- Apply it to every non-tile box on the screen: the Filters box, both donut cards, Top Vendors, Top Materials, Plant Analytics, the Main Group and Sub Group 1/2/3 charts, and the detail table card.
- Each chart's inner background stays transparent so the gradient shows through.
- Uses theme colors, so the Light, Dark and Glassy themes all still look right. The PDF keeps the same look.

## Technical details
- `open-po-dashboard.tsx`: create one shared `cardBg` style (about 18% primary at the top-left, 30% accent at the bottom-right). Use it in `Card`, the filter wrapper, and the `DetailsTable` section, in place of `bg-card`.
