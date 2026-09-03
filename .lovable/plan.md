# Sales by Main Group card (treemap with sub-group drill-down)

## What gets added

A new card beside "Top 5 materials" titled **Sales by Main Group (Amount)**, styled like the attached reference: coloured rectangles sized by amount, each showing the group name, the amount (₹ Cr / L) and its share percentage.

- Groups come from the Main Group column already stored on each line (same field used in the "Main / Sub group" table column).
- Top groups are shown individually; the remaining small ones are collapsed into an "Others" tile.
- Clicking a main-group tile drills into that group and re-draws the treemap with its Sub Groups. A back link ("← All main groups") returns to the top level; clicking the same tile again also collapses back.
- The card has the full-screen expand button, like Revenue trend, so the treemap can be viewed large; drill-down works in full screen too.
- Blank main groups are labelled "Unassigned".

## Technical notes

- `src/lib/sd-live.ts`: add a `byMainGroup` aggregate (name, value, count) and a helper to aggregate sub-groups for a selected main group; `mainGroup` / `subGroup` are already on `SdLine`.
- `src/components/sd-live-dashboard.tsx`: new `Panel title="Sales by Main Group (Amount)" accent={5} expandable` placed next to Top 5 materials; render a Recharts `Treemap` with a custom content renderer that draws name, amount and percentage, using the existing KPI colour tokens and the existing compact-amount formatter. Local `selectedMainGroup` state drives the drill-down.
- No data, schema or query changes.
