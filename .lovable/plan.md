# Sales Register tile renames + Sales by Model / Model Wise Type cards

## Sales Register tiles
- "Total Sales Count" → **Sales Invoices**
- "Total Net Value" → **Net Value**
- "Unique Customers" stays **Unique Customers**
- Total LAH unchanged.

## New cards (Sales Register and Order Book)
Add the same two side-by-side cards used on Net Sales:
- **Sales by Model** — horizontal blue bars per model, value label, ₹/AH under each model name, toggle Top 10 / Top 20 / All Models, expand button.
- **Model Wise Type** — horizontal teal bars per type, toggle Top 10 / Top 20 / All Types, expand button.
- Values follow each screen's existing value source (Sales Register: NETWR_TOT; Order Book: TOT_INR), in ₹ Cr; ₹/AH = value ÷ AH (Sales Register TOT_AH, Order Book TOT_AH).
- SAP keys: Sales Register MODEL and TYPE; Order Book MODEL and TYPE. Blank model/type shown as "Unassigned".
- Cards respect current filters; PDF shows Top 10.
- Placement: Sales Register — new row after Plant/Main/Sub Group row. Order Book — new row below existing chart rows.

## Technical details
- Reuse `SalesByModelChart` / type chart from `sd-live-dashboard.tsx` (export them or move to a shared component file) so the look matches exactly.
- Pure helper `rankModels(rows, value, ah, key)` with tests (Top-N, Unassigned bucket, ₹/AH).
- Add `model`/`productType` to `SalesRegisterRow` mapping from stored MODEL/TYPE; bump query key.
