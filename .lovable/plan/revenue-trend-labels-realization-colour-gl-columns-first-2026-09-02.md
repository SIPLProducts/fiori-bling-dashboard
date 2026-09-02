# Revenue trend labels, realization colour, GL columns first

## 1. Show values on the Revenue trend chart

Today revenue and documents only appear in the hover tooltip. Print both series' values directly on the chart:

- Revenue (blue area/line): compact currency label above each point.
- Documents (second line, right axis): plain number label above each point.
- Labels use each series' own colour with a light halo so they stay readable over the tinted plot area; thin out labels automatically when months are too dense.
- Slightly larger top margin so labels are not clipped.

## 2. Make "Avg realization (INR/unit) — right axis" clearer

Change the realization series from the current amber to a strongly contrasting colour (deep magenta/violet from the chart tokens) that is unmistakable against the green quantity bars, applied consistently to: the line, the point dots, the point value labels, the right axis title and ticks, and the legend swatch/text. Value labels get a stronger halo and bolder type so the numbers read clearly against bars.

## 3. GL account and GL name first in the table

Move the "GL account" and "GL name" columns to the front of the document table column order (before Document No), so they also appear first in the column picker and CSV export.

## Technical notes

- Single file: `src/components/sd-live-dashboard.tsx`.
- Revenue trend: add `<LabelList>` to the `<Area>` and documents `<Line>` with compact/number formatters and stroke-halo styling.
- Realization: replace `var(--kpi-3)` usages in the volume panel with a distinct token (e.g. `var(--kpi-6)`), keeping green `--kpi-5` for quantity; no hardcoded hex.
- Column order: reorder the `COLUMNS` array so `gl` and `glName` are the first entries.
- No data, query, or schema changes.
