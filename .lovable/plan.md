# Month Wise Stock dashboard (Inventory)

Build the Inventory → Month Wise Stock screen from the data uploaded in Tables Master → Month Wise Upload. Quantity = **CB Qty**, Value = **CB Val** (shown in ₹ Cr on screen, full values in table/Excel).

## Lookups
- **Group names** (Main Group, Sub Group 1/2/3): match each row's **Profit Centre** to **PRCTR** in ZPC GROUP → MNGRP1, PCGRP1, PCGRP2, PCGRP3. Empty groups ignored.
- **Type (used like "doc type" on purchase screens)**: match **ValCl** to **Valuation Class** in Valuation Class Wise Subgroup → Short Name (fallback Description, then code).

## Filters (collapsible, closed by default, like purchase screens)
Year, Month (From–To), Plant, Type, Material Group. "Data available: first – last month" beside Refresh.

## Tiles
- **Total Inv Val** first
- Then one tile per Type present (from Valuation subgroup), sorted by value — same style as Purchase Orders List tiles.

## Cards
1. **Month Wise Inventory** – radiant bar chart of CB Val per month (Apr–Mar order).
2. **Top Types** – top 8 or 10 by value depending on card height.
3. **Top 10 Plants** by value.
4. **Top 10 Material Groups** by value.
5. **Main Group**, **Sub Group 1**, **Sub Group 2**, **Sub Group 3** bar cards (₹ Cr), same as Purchase Register.
6. **ZKEYRM Comparison** – reuse the purchase card; month on month unit price = CB Val ÷ CB Qty per ZKEYRM material.
7. **Detailed table** – all columns incl. Main/Sub groups and Type, search, pagination, Excel download.

PDF export like other screens (no filters/table, HBL logo), file name "Month Wise Stock_DD-MM-YYYY". Launchpad card shows latest month and Total Inv Val. Responsive layout as other dashboards.

## Technical
- Read `public.month_wise_upload` (paged, all rows) + `sap_masters`/`sap_master_rows` for zpc_group and valuation_subgroup; pure mapper `src/lib/month-wise-stock-map.ts` (header names trimmed, since file headers have leading spaces like "     CB Val").
- New `src/components/month-wise-stock-dashboard.tsx` reusing Card/Tile/BarList from open-po-dashboard and ZrmmatCompareCard (rows adapted to PurchaseRow shape).
- Read policy: allow users with `inv.month-wise-stock` to read month_wise_upload and zpc_group/valuation_subgroup/zrmmat masters (migration + mirror in supabase/migrations), scoped by plant/profit-center access.
- Data refreshes only on Refresh click.
