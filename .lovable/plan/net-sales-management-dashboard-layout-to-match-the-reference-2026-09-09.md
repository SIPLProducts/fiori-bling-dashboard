# Net Sales — Management Dashboard layout to match the reference

Rebuild the Net Sales screen so its content area looks and reads exactly like the reference (no side menu). Existing filters, tabs and the extra Top 10 cards stay, moved below the reference layout.

## Page header

- Title block: "Management Sales Dashboard" with the sub-line "Executive Overview".
- Right of the title: a period chip showing the active posting-date range (e.g. "Jan 2025 - Aug 2026") and a "Filters" button that expands/collapses the existing Smart filters card.
- Smart filters keeps all current behaviour (dates, quick ranges, profit centre, search, reset), just collapsed by default behind the Filters button.

## Row 1 — six KPI cards

White cards, soft pastel round icon on the left, label on the right, large value underneath, and a green/red change line with the comparison label:

1. Total Sales (Amount)
2. Sales Growth %
3. Total Quantity (Lakhs)
4. Active Customers
5. Revenue / AH
6. Avg. Revenue / Customer

Total Sales and Active Customers keep the existing click-through to their detail tables. The Domestic/Service/Exports mini-bars move out of the Total Sales card to keep the row clean and uniform.

## Row 2 — three cards

- **Sales Trend (Amount)** — line chart with a Monthly / Quarterly / YTD toggle, current period as a solid blue line and previous period as a dashed grey line, amount axis in ₹ Cr.
- **Sales by Segment (Amount)** — donut with the total in the centre and a legend listing each segment with its percentage.
- **Top 10 Profit Centres by Amount** — compact horizontal bars with the amount at the right, "Amount (₹ Cr)" caption.

## Row 3 — three cards

- **Top 10 Customers by Amount** — teal compact bars, amounts right-aligned.
- **Customer Contribution (Pareto)** — blue bars plus orange cumulative % line with point labels.
- **Sales by Main Group (Amount)** — coloured tiles with name, amount and percentage; clicking a tile still drills into its sub groups.

## Row 4 — two cards

- **Sales vs Quantity Trend** — blue amount line and green quantity line on twin axes by month.
- **Management Alerts** — coloured circular icons with the alert sentence and the number highlighted, plus a "View All" link.

## Kept below

All/Domestic/Services/Exports tabs, Top 10 Materials, Top 10 Sales Employees, Sales mix by type and the Net Sales List table stay, arranged underneath the reference layout. Full-screen buttons and drill-downs are preserved.

## Technical notes

- Layout and card chrome only in `src/components/sd-live-dashboard.tsx`; new panel styles reuse `report-shell.tsx`.
- New analytics in `src/lib/sd-live.ts`: previous-period series for the trend comparison, quarterly/YTD aggregation for the toggle, and a combined monthly amount+quantity series for Sales vs Quantity Trend.
- Existing hidden-element flags and functionality are kept intact, not deleted.
