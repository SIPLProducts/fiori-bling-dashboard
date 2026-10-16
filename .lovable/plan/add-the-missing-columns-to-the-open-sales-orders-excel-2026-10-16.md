# Add the missing columns to the Open Sales Orders Excel

## Change
Add three columns to the Excel download, next to **Profit Centre**:
1. Profit Centre Name
2. Main Group
3. Sub Group

All existing columns stay in the same order. The values come from the same filtered lines as the detailed table. The charts, totals and PDF stay as they are.

With these columns you can filter the Production Excel to see which lines have an empty Main Group or Sub Group.

## Technical details
- `src/lib/open-sales-orders-export.ts`: add `profitCentreName`, `mainGroup` and `subGroup` column definitions after `profitCentre`.
- Map these fields from the stored `profit_center_name`, `main_group` and `sub_group` values in the table row mapping, if they aren't mapped already.
- Add a test asserting that the export headers include the three columns.
