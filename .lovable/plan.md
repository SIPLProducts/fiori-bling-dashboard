# Sales Growth tile + record counts in full-screen Top 10 cards

## What changes

1. **New "Sales Growth" KPI tile** in the first tile row:
   - Shows month-over-month growth as a percentage: `((Current month sales − Previous month sales) / Previous month sales) × 100` (e.g. Aug vs Jul).
   - Green value with an up arrow when positive, red with a down arrow when negative; caption shows the two months compared (e.g. "AUG-2026 vs JUL-2026").
   - Data already exists in the analytics (`kpis.momPct` / `kpis.momLabel`) — no new calculation or data change needed.
   - The tile row adjusts automatically from 5 to 6 tiles per row.

2. **Record counts visible in full-screen Top 10 lists**: when any of the four Top 10 cards (Profit Centres, Customers, Materials, Sales Employees) is opened full screen, each row shows its record count (number of document lines behind that amount) as a small value next to the amount. In the normal small cards the count stays available via the existing hover tooltip, keeping the compact layout unchanged.

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - Add a sixth `KpiCard` labeled "Sales growth" using `analytics.kpis.momPct` / `momLabel` (formatted to one decimal, with `TrendingUp`/`TrendingDown` icon and tone by sign). `momPct` is already computed in `buildSdAnalytics` from the last two months in the filtered selection.
  - `BarList`: when `full` (full-screen mode) is set, render the `count` as a small "N records" chip/value after the amount; keep normal mode unchanged.
- No data, schema, or sync changes.
