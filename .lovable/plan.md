# Sales report KPI: layout, labels and a Segment donut

## Changes

1. **Full-screen cards fit the screen, no scrolling** — in full screen the chart sizes itself to the available dialog height instead of a fixed pixel height, and the y-axis number labels (1000 Cr, 2000 Cr…) get tighter width/padding so the plot uses the space. The dialog body stops scrolling.
2. **Top customers** — customer names render on a single line (wider name column, no wrapping; long names truncate with the full name on hover).
3. **Replace "Revenue mix by type" with "Sales by Segment (Amount)"** — a donut chart matching the reference: coloured ring, total amount in the centre (e.g. ₹417.42 Cr with "Total" below), and a right-hand legend listing each segment with its percentage. Values come from the existing Segment field on the sales lines.
4. **Hide "Volume & average realization by month"** card.
5. **KPI tiles** — "Total revenue" renamed to "Total Sales", "Customers" renamed to "Active Customers", "Month-on-month" removed; the remaining five tiles sit in a single row.

## Technical notes

- `src/lib/sd-live.ts`: add a `bySegment` aggregate (sum of `amount` grouped by `segment`, ranked) to `buildSdAnalytics`/`SdAnalytics`. No schema or query change — `segment` is already selected.
- `src/components/sd-live-dashboard.tsx`:
  - KPI grid becomes `lg:grid-cols-5` with the renamed/removed tiles.
  - New `SegmentDonut` component (recharts `PieChart` + `Pie` with `innerRadius`, centre label, legend column) replacing the `StackedMix` panel; keeps `accent`.
  - Remove the "Volume & average realization by month" panel block (the `ComposedChart` helper stays unused-free by deletion).
  - `HBar`: widen the category axis and keep labels single-line.
- `src/components/report-shell.tsx`: full-screen dialog body switches from `overflow-auto` to a fixed, non-scrolling flex area so children can size to 100% height.
- Charts in full screen use `height="100%"` inside a `h-full` wrapper rather than fixed 620px, and reduced chart margins.
