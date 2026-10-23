# Purchase Register: add missing Material Group and Top Materials/Vendors sections

Match the Word document pictures, using the same sample figures.

## 1. Material Group (new row)
- **Material Group** card: coloured donut chart with "TOTAL 2,950.88" in the middle. Clicking a slice filters the screen by that group, the same way the Material Group dropdown does. Shows a "Click to filter" tag.
- **Material Group Summary** card next to it: a table with dark header (Material Group | Amount ₹ Cr), a coloured dot per row in the same colour as the donut, striped rows and a Total line. Rows: Imported 1,152.84, Raw Material 1,000.66, Others 708.95, Consumables 54.38, Packing Material 33.95, Finished Goods 0.08, Maintenance 0.02.
- The current small "Material Group" list card is replaced by these two cards.

## 2. Top Materials and Top Vendors (bar chart + table)
- Each becomes a wider card in the same style as Plant Analytics: coloured bars on top, then a table below.
- Top Materials table: Material Code | Material Name | Material Group | Amount (₹ Cr), with Total.
- Top Vendors table: Vendor Code | Vendor Name | Amount (₹ Cr), with Total.
- Material and vendor names in the bars are shortened with "…"; the full name shows in the table and on hover.

## Layout order
```text
Tiles
Purchase Trend | Purchase by Type
Top Materials (chart + table) | Top Vendors (chart + table)
Material Group donut | Material Group Summary
Monthly Expenditure | Quarterly Comparison
Plant Analytics | Profit Center Analytics
```
The PDF includes the new cards.

## Technical details
- `src/components/purchase-register-dashboard.tsx`: add a `GroupDonut` (recharts Pie, onClick sets `group` filter), a `SummaryTable` (dot + name + amount + total), and reuse `Columns`/horizontal bar + `CodeTable` for materials/vendors.
- `src/lib/purchase-register-sample.ts`: add vendor codes if missing; reuse existing MATERIAL_GROUPS / TOP_MATERIALS / TOP_VENDORS.
- Extend `tests/purchase-register-sample.test.ts`: material group amounts sum to 2,950.88.
