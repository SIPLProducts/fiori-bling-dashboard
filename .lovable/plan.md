# Make the volume/realization chart self-explanatory

## What the chart shows today

- **Green bars** = total quantity billed in that month (left axis).
- **Purple line** = average realization, i.e. revenue divided by quantity for that month — the average price per unit (right axis).

Neither series is named on screen, and both axes use the same compact number format, so the chart reads as unlabelled.

## Changes

1. **Add a legend** under the chart title: green swatch "Quantity (units)", purple line swatch "Avg realization (INR/unit)".
2. **Name the axes** — left axis labelled "Quantity", right axis labelled "Avg realization (INR/unit)", small muted text.
3. **Friendly series names in the tooltip** — "Quantity" and "Avg realization" instead of the raw `quantity` / `realization` keys, with quantity as a plain number and realization formatted as currency.
4. **Value labels on the line points** — the realization value printed above each dot (compact currency) so the line is readable without hovering, matching the bars which already show values.
5. Panel subtitle: "Bars = quantity billed; line = average price realised per unit."

## Technical notes

- Single file: `src/components/sd-live-dashboard.tsx`, the "Volume & average realization by month" panel.
- Use Recharts `<Legend />` with `name` props on `<Bar>` and `<Line>`; `label` prop on both `<YAxis>` elements; `<LabelList position="top">` inside the `<Line>`.
- Increase chart top/side margins slightly so axis titles and line labels are not clipped.
- No data, query, or schema changes.
