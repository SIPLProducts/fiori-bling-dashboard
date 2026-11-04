# Open Purchase Orders: reference-style colorful glass cards

Match the reference: each card gets its own soft glassy tint, and the bars look glossy and 3D. All text must stay easy to read.

## Card colors (each card gets its own tint)
- PO Value by PO Type: sky blue to aqua
- Delivery Aging Status: peach to lavender
- Top 10 Vendors: rose to blush
- Top 10 Materials: steel blue to slate
- Plant Analytics: copper to bronze
- Main Group and Sub Group 1/2/3: they cycle through teal, violet, amber and mint
- Filters box and detail table: a soft neutral blue tint
- Each card also gets a subtle white shine at the top edge, a thin colored border and a soft shadow. This gives the glass look.

## Bars and labels
- Top Vendors and Top Materials bars become rounded glossy pills, each in a different radiant color. Each sits on a light rounded track, as in the reference.
- Plant Analytics columns get a glossy vertical gradient with a highlight edge.
- Group chart bars get a light glossy overlay.
- Names, values and legend text become darker and bolder on light themes and brighter on dark themes, with a slight text shadow. They stay readable on every tint.
- Donut legend values are shown in bold.

## Notes
- Top tiles stay as they are.
- Works in Light, Dark and Glassy themes. Dark and Glassy use deeper versions of the same tints.
- The PDF keeps the same look.

## Technical details
- `open-po-dashboard.tsx`: add a `tint` prop to `Card` that picks from a `CARD_TINTS` map built on `color-mix` with `var(--card)`, so tints adapt to each theme. Restyle the `BarList` track/fill with gradients, an inset highlight and shadow. Add a gradient `<defs>` to the `PlantColumns` bars. Raise label font weight and use `text-foreground`.
- `order-book-subgroup-chart.tsx`: only an optional glossy overlay on the bars. Other screens are unaffected unless they opt in.
