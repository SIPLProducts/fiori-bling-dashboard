# Management Sales Dashboard — match the reference layout

Goal: make `/management-dashboard` look exactly like the reference image (spacing, colours, typography, card proportions, chart styling), while every number keeps coming from real SAP postings.

Confirmed decisions
- Real posting data drives all values (no dummy numbers).
- No left sidebar — the dashboard uses the full width.
- Any extra cards/sections stay where they are, below the reference layout.

## What changes

1. Layout
   - Remove the fixed navy sidebar from this page and drop the left offset so content spans full width. The sidebar component file stays in place, unused, so it can be brought back later.
   - Page background `#F7F9FC`, 18px horizontal padding, 12px grid gaps, white cards with 1px `#E5EAF1` border, 10–12px radius, minimal shadow.

2. Header
   - Title "Management Sales Dashboard" (24–26px, bold, navy) with "Executive Overview" beneath.
   - Right side: date-range control (calendar icon, current range text, chevron) and Filters button — both white, bordered, ~42px tall. Existing dropdown and filter panel behaviour is kept.

3. KPI row (6 cards, one row at >=1400px)
   - Total Sales (Amount), Sales Growth %, Total Quantity, Active Customers, Revenue / AH, Avg. Revenue / Customer.
   - Each: pastel circular icon (blue, green, purple, orange, cyan, lavender), 12–13px label, 20–23px bold value, coloured up/down comparison versus the previous period.
   - Cards remain clickable into the drill-down; hover stays very subtle.

4. Chart rows (restyled to the reference, same live data)
   - Row 1 (45 / 27 / 28): Sales Trend (Amount) with Monthly / Quarterly / YTD toggle and current vs previous period lines (blue solid, grey dashed); Sales by Segment donut with total in the centre; Top 10 Profit Centres horizontal blue bars with values on the right.
   - Row 2 (3 equal): Top 10 Customers (teal bars), Customer Contribution (Pareto) with blue bars plus orange cumulative-% line on a right axis, Sales by Main Group treemap with centred name / amount / share.
   - Row 3 (50 / 50): Sales vs Quantity dual-axis line chart (blue amount, green quantity) and Management Alerts list with coloured icons, emphasised percentages and a working "View All".
   - Light grid lines, compact axis labels, interactive tooltips, no dark chart surfaces on this page.

5. Responsive
   - 6 KPI cards in one row at >=1400px, 3x2 at 1024–1399, 2 per row on tablet, 1 on mobile. Charts resize; no horizontal page scroll.

## Technical notes

- Files touched: `src/components/management/dashboard.tsx` (drop sidebar, spacing/grid), `header.tsx`, `kpi-card.tsx`, `charts.tsx`, `alerts.tsx`. `src/lib/management-live.ts` keeps supplying data from `zfisales_detail`; only formatting helpers change if needed.
- `src/components/management/sidebar.tsx` is left on disk but no longer imported.
- Charts stay on Recharts; icons on lucide-react; colours applied via the reference palette (navy `#101B3D`, blue `#1769E8`, teal `#20A8A8`, green `#16A34A`, orange `#F59E0B`, purple `#7251B5`, border `#E5EAF1`).
- Verification: typecheck plus an authenticated browser pass at 1536x1024 checking no console errors, no overlap, and no horizontal overflow.
