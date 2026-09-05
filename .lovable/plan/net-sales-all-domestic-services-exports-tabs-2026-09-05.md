# Net Sales — All / Domestic / Services / Exports tabs

Add a tab strip on the right side of the source line ("Source: ZFISALES_DETAIL · … · last synced …") on the Net Sales screen.

## Tabs
- All (default)
- Domestic
- Services
- Exports

The data column that drives this is the sales type already stored with every line. Its stored values are `Domestic`, `Exports` and `Service` — the "Services" tab maps to `Service`.

## Behaviour
- Selecting a tab filters the whole screen, not just one card: KPI tiles (Total Sales, Billed Customers, Sales Growth, etc.), Sales Trend, all four Top 10 cards, Sales by Main Group treemap, Main Group vs Sub Group bars, Sales by Segment donut, and the ZFISALES_MIS List table.
- Line count and record counts shown in card titles/full-screen views recalculate for the active tab.
- The tab works together with the existing Smart Filter selections (posting date, profit centre, company code, etc.) — it narrows further, it does not reset them.
- Switching back to All restores the full picture. Main group / sub group drill-down resets when the tab changes.
- Last synced text and source line stay unchanged.

## Technical notes
- Filter applied in `src/components/sd-live-dashboard.tsx` on the already-loaded rows before `buildAnalytics` in `src/lib/sd-live.ts`, so no extra data fetch and no schema change.
- Tab state is local component state, default `All`; empty result sets fall back to the existing "no data" states.
