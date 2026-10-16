# Sales Zone by value + stop showing 01/10/18 as Division

## Finding (from your Production query)
SAP sends **DIVISION empty** on some rows, and **SPART = 01 / 10 / 18**. Our sync then falls back to SPART, so `01`, `10`, `18` were stored as the division and printed under the Plant-wise Pending bars. This is **our issue**, not the SAP response. (Rows like plant 1100 with DIVISION = NCPP are correct.)

## 1. Division uses DIVISION only
- Sync stores Division from SAP `DIVISION` only; when empty it stays empty (no SPART fallback).
- Backfill existing Open Orders rows: set division from `raw->>'DIVISION'` (empty when blank).
- Plant-wise Pending: under the bar show the division; when empty show the **plant name** (then plant code). Tooltip shows "Division: —" when empty.
- Division filter and Main/Sub Group tooltips simply skip empty divisions.

## 2. Sales Zone chart shows value
- Rename card to **Open Orders by Sales Zone**; bar height = **Open Value (₹ Cr)**, sorted highest first, "Value (₹ Cr)" title above the chart, value labels on bars.
- Tooltip: Sales Zone, Open Value (₹ Cr), Orders (distinct), Open Quantity. Same in PDF.

## Quality / Production steps (after I build)
- Run the new deploy script (backfill SQL + reload schema) on each server.
- Copy the updated `middleware/sync-core.mjs` and restart the middleware; rebuild the frontend.

## Technical details
- `src/lib/open-sales-orders-map.ts` and `middleware/sync-core.mjs` (Open Orders mapper, line ~316): pick `["DIVISION","division"]` only; rebuild sync-core.
- Migration + mirror in `supabase/migrations/` and `deploy/open-orders-division/fix-division.sql`: `update open_sales_orders set division = nullif(trim(raw->>'DIVISION'),'')`.
- `plant-pending-chart.tsx`: label fallback to name/code; `open-sales-orders-dashboard.tsx`: zone chart uses `value`.
- Tests: mapper ignores SPART when DIVISION empty; zone ranking by value; label fallback.
