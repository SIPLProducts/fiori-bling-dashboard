# Order Book — Top 10 Materials and Top 10 Sales Men

## Result
- Two new cards on the Order Book screen only, placed in a new row right after the existing Top 10 Customer / Product / Model Wise row:
  - **Top 10 Materials** — ranked by Order Value (NETWR), label = material description (MAKTX), falling back to material code (MATNR).
  - **Top 10 Sales Men** — ranked by Order Value (NETWR), label = sales employee name (NAME1_SE); lines without a name are left out.
- Same ranking-card style, tooltips, and order counts (distinct order numbers) as the other Top 10 cards; included in the PDF.
- They follow all Smart Filters and the user's assigned Plants. Open Sales Orders is unchanged.

## Technical details
- `open-sales-orders-dashboard.tsx`: compute `materials` (group by `material`, label `description`) and `salesMen` (group by `salesRepName`, skip empty) in metrics using the existing ranking helper, top 10; render two `RankingPanel`s when `isBook`.
- `order-book-data.ts` already maps `salesRepName` from `name1_se` and material/description from MATNR/MAKTX — no data or database change.
- Add a test for the Sales Men ranking (empty names excluded, top 10, value order).
