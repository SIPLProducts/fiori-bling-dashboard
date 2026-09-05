# Sync the two Main Group cards — one click drives both

## What changes

Today "Sales by Main Group (Amount)" (treemap) and "Main Group vs Sub Group (Amount)" (bar chart) each keep their own drill-down selection, so clicking a main group in one card does nothing to the other.

Make the selection shared:

1. **Click a main group in the treemap** → the bar chart card immediately switches to that group's Sub Groups, exactly as if its own bar had been clicked (title line shows the selected group).
2. **Click back in the treemap** ("← All main groups") → the bar chart returns to showing all main groups.
3. **Works the other way too** — clicking a bar in the bar chart also selects that group, and the treemap shows the same drill-in, so both cards always stay in sync.
4. Sub groups remain the deepest level: clicking a sub-group bar or tile does not drill further.
5. Works the same in full-screen mode.

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - Lift the selected main group state from `MainGroupBars` and `MainGroupTreemap` into the dashboard component (single `selectedMainGroup` state) and pass it down as a controlled prop (`selected` + `onSelect`) to both cards.
  - `MainGroupTreemap` keeps its extra "Others" drill path internally; only real main-group selections sync across. When "Others" (a combined bucket) is drilled, the bar chart keeps its current view since "Others" has no sub-group breakdown.
  - `MainGroupBars` drops its internal `useState` and uses the controlled prop.
- No data, query, or schema changes.
