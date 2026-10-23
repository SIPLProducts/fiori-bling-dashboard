# Sales Register: code + description filters, Cr tiles

## What changes
1. **Distribution Channel** filter shows `AUART — VTEXT_DC` (e.g. "ZDOR — Domestic Sales"); filtering still by code.
2. **Every code filter shows code + description** (description from the same SAP row):

| Filter | Code | Description |
|---|---|---|
| Distribution Channel | AUART | VTEXT_DC |
| Division | SPART | VTEXT_SD (fallback DIV_NAME) |
| Plant | WERKS | NAME1_P |
| Billing Type | FKART | VTEXT |
| Billing Document | VBELN | XBLNR (invoice no) |
| Sales Document | AUBEL | BSTNK (customer PO) |
| Sales Document Item | AUPOS | ARKTX |
| Customer | KUNAG | NAME_C |
| Sales Office | BEZEI_SO code not sent separately — shows BEZEI_SO |
| Material code | MATNR | ARKTX |
| Profit Center | PRCTR | MCTXT |

   Blank descriptions show the code alone. Plant/Profit Center stay limited to the user's assignments.
3. **Billing Document Date** and **Billing Creation Date** both use the date picker (Single / From–To); Billing Creation Date filters on ERDAT.
4. **Tiles in ₹ Cr**: Total Invoice Value and Total Net Value show `₹ X.XX Cr`; Unique Customers / Billing Documents stay counts. Chart labels already in Cr.

## Technical
- `sales-register-data.ts`: select extra columns (auart, vtext_sd, vtext, bstnk, mctxt, name1_p); add `*Desc` fields on the row; query key bump to v2.
- `sales-register.ts`: `SALES_REGISTER_CODE_KEYS` returns code; new `salesRegisterOptionLabels(rows,key)` → Map code→"code — desc"; channelCode now AUART.
- `sales-register-filters.tsx`: pass labels to `FilterMultiSelect` (use its label formatter / option objects as used on Open Orders).
- `sales-register-dashboard.tsx`: tiles use Cr formatter.
- Update `tests/sales-register.test.ts` for AUART channel code and label pairs.
