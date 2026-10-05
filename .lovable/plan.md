# Store Open Sales Orders from the SAP API

## Goal

Make every successful **Open _Sales _Orders** Test, manual sync, and scheduled sync store the SAP response in `open_sales_orders`, using **VBELN + POSNR** as the unique order-item identity.

The attached response contains 125 fields. Store the dashboard/reporting fields as typed columns and retain the complete original SAP object in `raw`, so no source field is lost.

## Confirmed current state

- The configured **Open _Sales _Orders** endpoint is active, uses `/zsd_open/open?sap-client=234`, and is scheduled at 05:30 and 13:00 IST.
- `open_sales_orders` already exists but currently has no rows.
- Its mapper and activation function exist, but the real sync path always uses the Sales/ZFISALES mapper and writes to `zfisales_detail`; the Open Sales Orders mapper is never called.
- The Open Sales Orders screen still reads generated sample records, not this table.
- The attached sample contains two valid rows with distinct VBELN + POSNR pairs and 125 response fields.

## Implementation

1. **Strengthen the Open Sales Orders table**
   - Keep the existing typed reporting columns and `raw` response.
   - Add typed fields required by the supplied API and current report where they are not yet represented, including model, product range/type, sales zone, delivered quantity, plant name, sales representative, and relevant descriptive fields.
   - Require non-empty `sales_order` and `sales_order_item` values for accepted rows.
   - Enforce one active row per **sales_order + sales_order_item** with a partial unique index, while still allowing a new response to be staged before activation.
   - Preserve authenticated read access through the existing Open Sales Orders permission and service-only writes.

2. **Map and validate the attached response**
   - Map `VBELN` to `sales_order` and normalized `POSNR` to `sales_order_item`.
   - Normalize SAP dates, padded/trailing-minus numbers, quantities, values, status codes, customer/material fields, model/range/type, and sales dimensions.
   - Use the API’s pending/open amount field first, with a documented fallback only when it is blank.
   - Preserve every source field in `raw`.
   - Reject rows missing VBELN or POSNR and reject duplicate VBELN + POSNR pairs within one response instead of silently overwriting them.

3. **Add a dedicated atomic storage path**
   - Route only endpoint-name variants matching **Open _Sales _Orders** to the Open Sales Orders mapper and table.
   - Stage the complete validated response, verify the staged count and unique business keys, then atomically replace the previous successful active result and activate the new rows.
   - This provides insert/update behavior by VBELN + POSNR while also removing orders no longer returned by SAP.
   - A failed HTTP call, invalid JSON, duplicate key, invalid row, empty response, staging error, or activation error will leave the previous active data unchanged.
   - Record received, stored, replaced, invalid, response size, duration, and status in the existing sync history.

4. **Cover every execution path**
   - Apply the same routing and persistence behavior to portal Test, manual sync, hosted scheduling, and the self-hosted middleware scheduler.
   - Keep the saved `fkdat` for Test/manual calls and use the current local date for scheduled calls.
   - Rebuild the checked-in middleware sync bundle so Quality and Production use the same mapper and validation rules.
   - Leave the Sales/ZFISALES synchronization path unchanged.

5. **Keep this phase storage-focused**
   - Do not switch the Open Sales Orders dashboard from sample data in this change.
   - After storage is verified with a real successful response, the next phase can connect the existing dashboard to active `open_sales_orders` rows without changing its design.

## Validation

- Test the two attached sample rows and confirm the stored keys are `1027671 + 150` and `1027920 + 50`.
- Test numeric/date normalization and preservation of all 125 source fields in `raw`.
- Test duplicate VBELN + POSNR rejection, missing-key rejection, successful atomic replacement, removal of missing orders, and rollback on failure or empty response.
- Run one manual Open Sales Orders sync and reconcile valid received rows with active table rows and sync-history counts.
- Confirm a second sync updates matching keys, inserts new keys, removes absent keys, and creates no active duplicates.
- Run focused tests, type checks, and confirm a clean preview build.

## Technical note

A normal global unique constraint cannot coexist with safe staging because the incoming staged row and prior active row temporarily share the same VBELN + POSNR. A unique index limited to active rows preserves the requested business key while allowing validation before the atomic switch.
