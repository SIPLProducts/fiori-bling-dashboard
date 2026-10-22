# Sales Register: save SAP data and show it on the screen

## Saving the data
- New table **sales_register** that stores every field in SAP's response (all 180+, including ZWREXPDT, BATTERY_SERIAL_NO, MATERIAL_COST, etc.) plus the full original row.
- One row per invoice line (Billing Document VBELN + Item POSNR). A new sync updates existing lines and adds new ones, so nothing is lost or duplicated.
- Amounts with commas/spaces (e.g. `"  462,000.00"`) are saved as proper numbers, and dates are saved as dates.
- Users see only lines for their assigned Plant / Profit Centre (same rule as other screens).

## Screen mapping
| Screen item | SAP field |
|---|---|
| Bill. Date / Data available | FKDAT |
| Bill. Doc. No | VBELN |
| Invoice No | XBLNR |
| Customer / Customer Name | KUNAG / NAME_C |
| Plant | WERKS – NAME1_P |
| Profit Center | PRCTR |
| Main / Sub Group | MAIN_GRP / SUB_GRP (MAIN_GROUP / SUB_GROUP when blank) |
| Distribution Channel | VTEXT_DC |
| Product Category | DIV_NAME |
| Material Description | ARKTX |
| Billed Qty | FKIMG |
| Net Value | NETWR_TOT |
| Total Invoice Value | NETWR_T (net + tax) |
| CGST / SGST / IGST / TCS | KWERT_CGST / KWERT_SGST / KWERT_IGST / TCS |
| Posting Status | RFBSK = C → Posted, otherwise Pending |

- Tiles, charts, table and "Data available" fill from this data. The Smart Filters dropdowns list values found in the data (Plant and Profit Center limited to your assignments), and every filter narrows the tiles, charts and table.
- The data loads once and changes only when you click Refresh/Sync.

## Technical details
- Migration (mirrored in `supabase/migrations` and `deploy/sales-register/install-sales-register.sql`): `public.sales_register` typed columns + `raw jsonb`, unique (vbeln, posnr), grants, RLS using `user_can_see(werks, prctr)`, updated_at trigger.
- `src/lib/sales-register-map.ts`: pure mapper (numeric normalization, dates), with tests from the sample.
- `storeSalesRegisterPayload` in `sap-pull.server.ts` and same in `middleware/sync-core.mjs`; routed by endpoint name containing "salesregister".
- `src/lib/sales-register-data.ts`: paged read of all rows → `SalesRegisterRow`; filters wired in `sales-register-filters.tsx` via lifted state in `dispatches.tsx`.
