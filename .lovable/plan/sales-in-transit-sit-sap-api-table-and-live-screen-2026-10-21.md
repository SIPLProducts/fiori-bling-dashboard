# Sales In Transit (SIT): SAP API, table and live screen

## 1. Request tab (SAP API Settings)
- Remove the "Use Order Book request fields" button and the fixed Order Book form.
- Instead, the fields above the payload are built from whatever is pasted in the payload, for every API:
  - Date keys (ending `_F` / `_T`, e.g. FKDAT_F, FKDAT_T, ERDAT_F, ERDAT_T) show as date pickers labelled "From" / "To".
  - Other keys (e.g. VKORG) show as text inputs.
  - Commented-out keys (e.g. `// "FKDAT_T": ...`) show as optional, left empty.
  - Editing a field updates the payload, and editing the payload updates the fields.
- Existing Order Book endpoints keep working: their saved payload simply shows its own fields.
- SIT payload: `VKORG` (required), `FKDAT_F` From date (required), `FKDAT_T` To date (optional, left out when empty).

## 2. New table `sales_in_transit` (Z_SIT)
- One row per billing line: **VBELN + POSNR**, updated in place on every sync (no snapshots), like Order Book.
- All 173 response fields get their own column (text, numbers and dates typed), plus the complete original row.
- Same access rule as the other screens (assigned Plant or Profit Centre), read-only for users.
- Same sync schedule as the other APIs; scheduled runs send FKDAT_F/FKDAT_T from the endpoint's date window.

## 3. SIT screen mapping
| Screen item | SAP field |
|---|---|
| Value (tiles, charts, table) | NETWR_TOT (₹, shown in Cr) |
| SIT Orders count | distinct VBELN |
| SIT LAH | TOT_AH |
| Quantity | FKIMG |
| Date / Month on Month | FKDAT (billing date) |
| Sales Document Type | FKART + VTEXT |
| Distribution channel | VTEXT_DC |
| Plant | WERKS + NAME1_P |
| Profit Centre | PRCTR |
| Customer | NAME_C (sold-to KUNAG) |
| SIT By Zone | BEZEI_SO |
| Division | DIVISION / DIV_NAME |
| Main / Sub Group | MAIN_GRP / SUB_GRP |
| Product | MATNR + ARKTX |
| Order ref / Requested date | AUBEL / BSTDK |

- Filters, Refresh, last-sync time, Excel/PDF work as on Order Book; the launchpad SIT tile shows current-FY SIT value.
- Please confirm NETWR_TOT is the right value field (other options: NETWR_T incl. tax, PRICE_CELLINR).

## Technical details
- `src/lib/sit-map.ts` pure mapper + `isSitEndpoint` (name/path contains "sit"); wired into `sap-pull.server.ts`, middleware `sync-core.mjs`/`scheduler.mjs` (rebuilt).
- Generic payload-field parser helper (pure, tested) replaces `OrderBookRequestFields` in `sap-api.tsx`.
- Migration + `deploy/sit/install-sit-table.sql` (table, GRANTs, RLS via `user_can_see(werks, prctr)`, indexes, trigger, endpoint seed).
- `src/lib/sit-data.ts` maps rows to the shared dashboard row shape; dashboard `sit` query reads it with a new query key.
- Tests: mapper (VBELN+POSNR key, numeric "8,220.00" normalisation, dates), payload parser, value field.
- Quality/Production: run the deploy SQL, copy middleware, rebuild frontend.
