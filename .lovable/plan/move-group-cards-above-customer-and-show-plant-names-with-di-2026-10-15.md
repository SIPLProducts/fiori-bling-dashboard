# Move group cards above Customer, and show plant names with Division in Plant-wise Pending

## 1. Card order: Main Group and Sub Group above the Customer card
The two cards **Open Orders by Main Group** and **Open Orders by Sub Group** move from their current spot directly under the summary tiles to immediately above the ranking row that starts with **Top 10 Open Orders by Customer**.

Resulting order on screen:
1. Smart Filters
2. Summary tiles (Total Open Orders, Open Order Value, Pending Orders Against AH)
3. Sales Document Type · Aging Bucket · Value Trend · LD Status
4. Sales Zone and Plant-wise Pending
5. **Open Orders by Main Group · Open Orders by Sub Group** (new position)
6. Top 10 Open Orders by Customer · by Product · Model Wise
7. Status cards, Quick View, detailed table

The cards themselves do not change: vertical bars, group names along the bottom, Value (₹ Cr) on the left, tooltips with Division(s), Open Orders and Open Value, same colors and widths.

## 2. Plant-wise Pending: plant name instead of code, Division in the tooltip
- The label under each bar becomes the **plant name** (for example "HBL VIZIANAGARAM") instead of the plant code ("1600"). Where SAP has not supplied a name, the code is shown so the bar is still identifiable.
- The tooltip keeps the plant name and code, and adds a **Division(s)** line listing every division related to that plant in the current filtered data, using the same code — description style as the Main Group and Sub Group tooltips (for example "VZM — VRLA", "VZM — Scrap", "VZM — CPD"). Divisions are listed once per plant even when an order touches several lines.
- Pending Value (₹ Cr), Pending Quantity and Open Orders figures, bar colors, value labels, and the bottom total stay exactly as they are.
- Long plant names are shortened on the axis with the full name available in the tooltip; labels rotate when bars are close together, as they do today.
- This applies to both the on-screen card and the PDF, which share the same chart.

## What does not change
Filters, summary tiles, all other charts and their calculations, the detailed table (still line-item based), search, status selection, pagination, Refresh behaviour, and Excel contents.

## Technical details
- `src/components/open-sales-orders-dashboard.tsx`: relocate the existing `order-group-row` block (the two `Panel` entries using `OpenOrdersGroupChart`) to directly before the `order-ranking-row` block; no data or chart logic changes.
- `src/lib/open-sales-orders-plants.ts`: `summarizePlantPending` additionally collects the divisions of each plant's rows (code, plus description when SAP supplies one) into a sorted `divisions` list on each plant entry, following the same pattern as `summarizeOpenOrderGroups`. Values, quantities and unique-order counts are untouched.
- `src/components/plant-pending-chart.tsx`: the bottom axis switches from the plant code to the plant name (code as fallback), with width-aware truncation and the existing rotation for dense bars; the tooltip header shows name and code and gains the Division(s) line.
- `src/styles.css`: no new rules needed — the moved row has no position-dependent styling, and the wide-desktop two-column arrangement assigns explicit rows only to the paired charts, ranking and status rows.
- Validation: run the plant summary test with rows carrying divisions (asserting a plant lists each division once and order counts are unchanged), then run the full suite. Check the screen at your window size (889 px) and a wide desktop width for the new card order and readable plant names, confirm the tooltip lists divisions, and confirm the PDF follows the same order and shows plant names. Inspect the build log.
