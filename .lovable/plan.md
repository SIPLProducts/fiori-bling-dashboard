# Purchase Orders: switch to new ZPO_LIST API

## What changes for you
- SAP API Settings: Purchase Orders now calls `POST /zpo_list/polist?sap-client=234` with the new request:
  `EBELN, WERKS, EKGRP, BSART, MATNR, LIFNR, BEDAT_FROM, BEDAT_TO`.
  The date window (From / To) fills `BEDAT_FROM` / `BEDAT_TO` (YYYYMMDD); the other keys are optional filters.
- Every key in the new response is saved and shown on the Purchase Orders screen. The old ZME2N keys still work, so existing data is untouched.
- Main Group, Sub Group, Sub Group 2 and Division are shown like on the other purchase screens (filters, group cards, table and Excel; blanks ignored).

## Key mapping (new SAP key -> what the screen shows)

| SAP key | Screen field |
|---|---|
| EBELN / EBELP | PO / PO Item |
| PO_DATE, DOC_DATE, EINDT | PO Date, Doc Date, Delivery Date |
| BSART | PO Type (DOMESTIC/PROJECT/... groups unchanged) |
| SUPERFIELD | Vendor name |
| EKGRP | Purchasing Group |
| EMATN, TXZ01 | Material, Description |
| WERKS, LGORT | Plant, Storage Location |
| MENGE, MEINS | Quantity, Unit |
| NETPR, PEINH, WAERS | Net Price, Price Unit, Currency |
| NETWR | PO Value (Cr totals still INR only) |
| MAIN_GROUP, SUB_GROUP, SUB_GROUP2 | Main Group, Sub Group 1, Sub Group 2 |
| DIVISION_NAME | Division |

Note: the new response has no open/still-to-deliver/invoiced values, vendor code, plant name, or user/buyer. Those tiles and columns will show 0 / blank for new data; tell me if you want them removed.

## Technical details
- `purchase-orders-map.ts`: accept new keys as aliases (EBELN->po, EBELP->po_item, EINDT->delivery_date, BSART->po_doc_type, SUPERFIELD->name_of_vendor, EKGRP->purchasing_group, EMATN->material, TXZ01->short_text, WERKS->plant, LGORT->storage_location, MENGE->order_quantity, MEINS->order_unit, NETPR->net_price, PEINH->price_unit, WAERS->currency_key, NETWR->net_order_value) and `sapGroupColumns(raw)` for groups; add `division_name`.
- Endpoint detection also matches `zpo_list` / `polist`.
- Migration (Cloud + mirrored `supabase/migrations/`): add `mngrp1, pcgrp1, pcgrp2, pcgrp3, division_name` text columns to `purchase_orders` if missing, backfill from raw; update `sap_endpoints` row Purchase_Orders path/body to the new payload.
- `sap-pull-shared.ts` + API settings form: BEDAT_FROM/BEDAT_TO date keys for this endpoint.
- Data/screen: query new columns, add filters/cards/columns; bump query key.
- Rebuild `middleware/sync-core.mjs`; update tests for the new mapping.
- Upsert on PO + item and stale-line delete in PO-date span stay as is.
