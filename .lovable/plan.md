# Remove "Month on month" label + new Main/Sub Group bar chart card

## What changes

1. **Remove the "Month on month" label** on the Sales Growth tile. The caption keeps only the months compared (e.g. "AUG-2026 vs JUL-2026"); the "Month on month ·" prefix is removed.

2. **New card: "Main Group vs Sub Group (Amount)"** placed beside "Sales by Main Group (Amount)":
   - Default view: a proper X/Y axis bar chart (Recharts `BarChart`) of all Main Groups by amount — X axis = Main Group names, Y axis = amount (₹ Cr/L/K ticks), value labels on the bars, and full details (name, exact amount, record count) in the tooltip.
   - Clicking a Main Group bar drills in: the card title/subtitle shows the selected group and the chart redraws with only that group's Sub Groups as bars. A "← All main groups" back link returns to the top level.
   - The card gets the full-screen expand button like the other cards; drill-down works in full screen too.
   - No new data needed — reuses the existing `byMainGroup` and `subGroupsByMainGroup` analytics.

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - Sales Growth `KpiCard` caption: drop the `"Month on month · "` prefix, keep `analytics.kpis.momLabel`.
  - Add a `MainGroupBars` component: local `selected` state, renders a Recharts `BarChart` with `analytics.byMainGroup` (or `analytics.subGroupsByMainGroup[selected]` after drill-in), clickable bars (cursor pointer), value `LabelList` on bars, compact axis ticks, and a back link when drilled in.
  - New `Panel title="Main Group vs Sub Group (Amount)" accent={…} expandable` next to the treemap panel.
- No data, schema, or query changes.
