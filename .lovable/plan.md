# Material Price Movers — clear Rising / Falling split in "All"

## What changes
When **All** is selected, the card shows two side-by-side panels instead of one mixed list:

```text
+-------------------------------+-------------------------------+
| ▲ Rising (7)   red border     | ▼ Falling (9)   green border  |
| light red tint header         | light green tint header       |
| rising tiles, one per row     | falling tiles, one per row    |
| own Prev / Next               | own Prev / Next               |
+-------------------------------+-------------------------------+
```

- Left panel = Rising only, red coloured border and red header band with count.
- Right panel = Falling only, green coloured border and green header band with count.
- Each panel pages on its own (5 tiles per page), so one side never pushes the other.
- Search and "Highest spend / Biggest rise / Biggest fall" sort apply to both panels.
- If a side has no matches it shows "No rising materials" / "No falling materials".
- On phones the two panels stack (Rising first, then Falling).
- **Rising** or **Falling** chips keep today's two-column grid of just that type.
- Tile design, eye quick view and click-to-open stay the same.

## Technical
- Only `src/components/material-trend-card.tsx`: separate sorted/searched lists for rising and falling, a small `MoverPanel` sub-component with its own page state, rendered in `md:grid-cols-2` when filter is "all". No data/logic changes.
