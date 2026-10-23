# Purchase Register dashboard (sample data)

Build the Purchase Register screen with the cards from your Word document, in the same look as the Sales Register screen (gradient tiles, coloured bars, radiant colours, PDF button, filters). For now every number comes from the sample figures in the document. Once the SAP API is shared, the real data replaces them.

## Layout
- **Header:** title, "Data available" period, PDF button.
- **Filters row:** Year, Plant, Type, Material Group, Month, with Reset. They filter the sample data.
- **Tiles (4):** Total Purchase Value (2,950.88 Cr), Domestic (2,262.12 Cr, 76.7%), Imported, Service.
- **Row 1:** Purchase Trend (monthly, Apr–Mar columns) · Purchase by Type (donut).
- **Row 2:** Top 10 Materials (name, code, group, ₹ Cr) · Top 10 Vendors (name, code, ₹ Cr) · Material Group bars.
- **Row 3:** Monthly Expenditure (stacked Domestic / Imported / Service) · Quarterly Comparison (2026-27 vs 2025-26, with the YoY % badge).
- **Row 4:** Plant Analytics (Top 10 bars + code/name/amount table with total) · Profit Center Analytics (the same layout).
- All values are shown in ₹ Cr.
- A small "Sample data" badge shows the numbers are not live yet.

## Technical details
- `src/lib/purchase-register-sample.ts` holds the static datasets from the document, plus small pure aggregation helpers.
- `src/components/purchase-register-dashboard.tsx` reuses the Sales Register panel, tile, RankList and colour palette patterns, and the shared PDF capture with `datedFileName("Purchase Register", ...)`.
- The existing `/reports/mm/purchase-register` route renders the dashboard in place of the "coming soon" message. The permission check stays.
- Test: the tile totals and the quarterly YoY % come from the sample data (YoY = −62.9%).
