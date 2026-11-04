# Open PO label and tile updates

## Open Purchase Orders tiles
- Rename "Total PO Value" to "Total Val", "MIGO Received Value" to "Gr Val", and "Open / Pending Value" to "Open Val".
- Remove the "Open POs / Vendors" tile. The other three tiles share the row.

## Donut cards
- PO Value by PO Type table headings: "Type", "Val", "%".
- Delivery Aging Status table headings: "Days", "Val", "%".
- New aging bands from SAP DAYS: 0–60, 61–180, 181–365, >365. These replace the old 1–180 / 181–365 / 365–730 / >730 bands on screen, in the filter and in exports.
- Rename "Top 10 Vendors by Open Value" to "Top 10 Vendors".

## Cr label on tiles (Open Purchase Orders, Purchase Register, Purchase Orders)
- Tile values show as plain numbers without "Cr" after them.
- A small "Val in Cr" caption sits under each money value. Count tiles stay as they are.

## Technical
- Edit `open-po-dashboard.tsx` and `open-po-data.ts` (aging bucket helper and its tests), `purchase-register-dashboard.tsx`, and the Purchase Orders screen tiles.
- Update the existing aging test to cover 60/61, 180/181 and 365/366 boundaries.
