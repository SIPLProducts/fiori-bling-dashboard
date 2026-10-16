# Sales Zone by value + Plant-wise Pending "10" labels

## 1. Sales Zone chart shows value
- Rename the card to **Open Orders by Sales Zone**.
- Bar height = **Open Value (₹ Cr)** per zone, sorted highest value first; left scale titled "Value (₹ Cr)" above the chart (same style as Plant-wise Pending).
- Label above each bar: value (e.g. `854.76`).
- Tooltip: Sales Zone, Open Value (₹ Cr), Orders (distinct order numbers), Open Quantity.
- Same change in the PDF. Filters and totals unchanged.

## 2. Plant-wise Pending "10" — is it SAP or us?
The label under each bar is the **DIVISION** value SAP sends for that plant's rows. In Production some plants show `10`, others show text like `HBL KOLKOTA`, `VSEZ`, `NCPP`. In Quality/preview the same field holds `VZM`. So the app is printing what is stored; the question is what SAP returns.

How to check in Production (SQL editor, port 9012, or `docker exec -i mis_p_db psql -U supabase_admin -d postgres`):

```sql
select plant, plant_name, division,
       raw->>'DIVISION' as sap_division,
       raw->>'SPART'    as sap_spart,
       count(*)
from public.open_sales_orders
where is_active_snapshot
group by 1,2,3,4,5
order by 1;
```

- If `sap_division` is `10` (or empty and `sap_spart` = `10`) → it is the **SAP response**; the SAP team must fill DIVISION with the code (VZM etc.) like in Quality.
- If `sap_division` is `VZM` but `division` is `10` → it is **our mapping**; I fix it and you re-sync.

App-side safety change (independent of the result):
- Under each bar show the **plant name** when the division is a bare number (like `10`) or missing; the tooltip still shows "Division: 10" so nothing is hidden.

## Technical details
- `src/components/open-sales-orders-dashboard.tsx`: zone metrics sorted by `value`; `CompactSalesZoneChart` and PDF zone chart use `dataKey="value"`, `plantChartMaximum` over values, `formatCr`-style labels; tooltip reorder.
- `src/components/plant-pending-chart.tsx`: `plantLabel` falls back to `plant.name` (then code) when divisions are all numeric-only.
- Tests: zone ranking by value; numeric-division label fallback.
