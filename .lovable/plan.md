# Cash Flow Screen: Button Tooltips, Colored Table Rows, Radiant Charts, Page-Size Selector

## Goal
Make the Cash Flow screen match the polish of the other report screens: hover tooltips on every button, colored/striped ledger rows, radiant gradient chart fills, and a records-per-page selector.

## 1. Button tooltips (hover descriptions)
Add a native `title` attribute (same approach used on the Open Orders screen) to every button in `src/components/cash-flow-dashboard.tsx`:

- **Refresh icon** — "Reload cash flow data from the database"
- **Sync button** — "Sync ZCASH_FLOW data from SAP"
- **Download Report** — "Download the filtered ledger as an Excel file"
- **Pagination buttons** (First / Previous / Next / Last page) — describe each action

Existing `aria-label`s are kept; `title` adds the visible hover tooltip.

## 2. Colored ledger rows (same pattern as other screens)
Apply the Open Orders `order-detail-row` coloring style to the Cash Flow ledger in `src/styles.css`:

- Base row background tinted by the row's **Classification** (or PC Group) color via `color-mix(in oklab, <color> 8%, var(--card))`
- Even rows slightly stronger tint (zebra striping)
- Hover highlight
- Distinct accent color per Classification value, consistent with the chart colors (using existing `--kpi-*` / semantic tokens, no hardcoded colors)

Implemented by giving each `<tr>` a `data-classification` attribute in the dashboard and adding matching CSS rules.

## 3. Radiant chart colors
Update `src/components/cash-flow-charts.tsx` to use gradient fills like the Open Orders charts:

- Add `<defs><linearGradient>` per series (light top → color mid → deep bottom using `color-mix` with existing theme tokens)
- Apply gradients to the Plant & Profit Centre bars, Nature donut slices, and Credit vs Debit Trend bars
- Keep tooltips, labels, totals and legend behavior unchanged

## Technical details
- Files touched: `src/components/cash-flow-dashboard.tsx`, `src/components/cash-flow-charts.tsx`, `src/styles.css`
- No data, query, sync, or export logic changes; Excel/PDF output untouched
- Colors use existing semantic tokens so light/dark mode both work
- Verify in preview at 951×529, 1280, and mobile widths
