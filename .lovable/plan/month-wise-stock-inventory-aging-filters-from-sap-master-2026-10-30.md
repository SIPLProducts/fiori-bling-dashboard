# Month Wise Stock & Inventory Aging: filters from SAP MASTER

## What you will see
Both screens get a filter bar at the top. Every dropdown is filled from the sheets uploaded in SAP MASTER:

From sheet "Sheet1":
- Plant (Plnt), Location, Material (code + description), Profit Center, Material Type (MTyp), Valuation Class (ValCl), Valuation Type, G/L Account (code + description)

From sheet "Data":
- Main Group (MNGRP1), Sub Group 1 (PCGRP1), Sub Group 2 (PCGRP2), Sub Group 3 (PCGRP3)

- Each dropdown allows picking several values, with search, plus Clear / Reset buttons.
- Below the filters a message says the stock data will appear once the SAP API is connected.
- When a new Excel is uploaded in SAP MASTER, the dropdowns update automatically.
- If a sheet or column is missing, that dropdown shows "No values — upload in SAP MASTER".

## Technical details
- New pure helper in `src/lib/sap-master.ts`: `masterOptionsQuery(master, column, descColumn?)` (React Query, stable key, refresh on click only) returning `{code,label}` lists de-duplicated and sorted.
- New shared `InventoryMasterFilters` component with the filter config (sheet + column per field) in one list, so sheet/column names can be changed in one place.
- Use it in `reports/inv/month-wise-stock.tsx` and `reports/inv/inventory-aging.tsx`, replacing the coming-soon body; filter state kept in the screen (null = unrestricted) ready for the data later.
- Small test for the option helper (dedupe, code+description label).
- No database change.
