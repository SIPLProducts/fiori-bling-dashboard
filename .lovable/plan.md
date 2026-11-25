# Open Purchase Orders: Open Value focus + Plant popup

## Tiles
- Hide the **Total Val** and **Gr Val** tiles. Only **Open Val** stays, with the line count under it.

## Cards show Open Value
Cards that now show PO value will show **Open Value** instead (₹ Cr), and their small captions will say "Open value":
- PO Value by PO Type -> **Open Value by PO Type**
- Top 10 Materials
- Plant Analytics
- Main Group and Sub Group 1, 2, 3 charts -> **Open Value by ...**
- Top 10 Vendors, Delivery Aging, Purchasing Group and Storage Location already use Open Value, so they stay the same.
- The Daily PO vs MIGO trend stays the same because it compares PO and GR.
- The detailed table and Excel stay the same. They keep all value columns.

## Plant Analytics click popup
- Clicking a plant bar opens a popup titled "<Plant name> – Open POs".
- The popup shows:
  - Small summary: Open Val, number of POs and lines.
  - Top vendors and top materials for that plant by open value.
  - A searchable list of that plant's open lines: PO Date (dd-mm-yyyy), PO No, Vendor, Material, Open Qty, Open Value (₹ in full), Delivery Date, Days.
- The popup uses the filters already on the screen. It does not appear in PDFs.
- The mouse cursor changes to a pointer over the bars.

## Technical details
- `open-po-dashboard.tsx`: remove two `Tile`s; switch `sumBy` value selectors and `grpRows` to `r.openValue`; `PlantColumns` gets `onSelect(name)` via Bar `onClick`; add a shadcn `Dialog` that filters `filtered` by `plantName || plant`.
