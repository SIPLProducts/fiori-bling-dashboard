# Improve Sales Report KPI — cards and charts

Visual and analytical upgrade of the Sales report KPI screen (ZFISALES_MIS). Filters, access control and data source stay exactly as they are.

## KPI cards

Replace the four flat cards with a richer, Fiori-style KPI strip:

- Each card gets an icon badge, large value, secondary hint, and a period-over-period delta (current filtered period vs the immediately preceding equal-length period) shown as a green/red pill with an up/down arrow.
- Add a small inline sparkline of the monthly trend inside the first card so the headline number carries context.
- Cards become six, in a responsive grid:
  1. Total sales value (with sparkline + delta)
  2. Documents (with delta)
  3. Customers
  4. Average per document
  5. Top profit center (with share % progress bar)
  6. Top plant (with share % progress bar)
- Full precise amount shown on hover (tooltip) since values are abbreviated to L/Cr.
- Cards get a subtle left accent bar and hover lift consistent with the existing tile look.

## Charts

1. **Sales trend by month** — combined chart: revenue area plus a document-count line on a right-hand axis, so volume and value read together. Adds a dashed average-revenue reference line and a legend.
2. **Sales by plant** — horizontal bars stay, but bars are ranked and colour-graded by contribution, with value plus share-of-total in the label and a top-N control.
3. **Sales by profit center** — becomes a Pareto view: bars sorted descending with a cumulative-percentage line (80% marker), which is the standard reading for contribution analysis.
4. **New: Sales mix by sales type** — donut chart with centre total and legend showing amount and share, giving a mix dimension the screen currently lacks.
5. Shared chart polish: consistent tooltip card, unified currency formatting, empty-state message when a filter combination returns no rows, and skeletons matched to chart height.

## Technical notes

- `src/lib/sd-kpi.ts`: extend `SdKpiResult` with `previous` period totals (revenue, documents) derived from the same filters shifted back one period length, `bySalesType` rollup, `topPlant` + share, and cumulative share values on `byProfitCentre`. Pure functions only; no schema or server changes.
- `src/routes/_authenticated/reports/sd/kpi.tsx`: new `KpiCard` local component, `ComposedChart`/`Line`/`Pie` imports from recharts, reference line, donut panel. Export buttons keep working on the same row arrays.
- All colours come from existing design tokens (`--color-primary`, `--color-success`, chart tokens); no hardcoded hex.
