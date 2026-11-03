# Open Purchase Orders: Document Date settings, Excel data load, Purchase Register look

## 1. SAP API Settings: Document Date (Open_Purchase_Order only)
- Rename "Posting date range" to **Document date range**. The presets stay the same.
- Rename "Posting From Date" to **Document From Date**. It is sent as `DOCUMENT_DATE.FROM_DATE`.
- Rename "Posting To Date" to **Document To Date**. It is sent as `DOCUMENT_DATE.TO_DATE`.
- Stop adding BUDAT_F/BUDAT_T to this payload. PLANT (for example `1100`) is always sent. Other empty keys are sent unchanged.

## 2. Save the uploaded Excel (58 rows, 30 columns) into the Open Purchase Order table
- Map each Excel header to its column: Plant, Plant Name, PO Type, PO, PO Item, Main/Sub Groups, Deliv. Compl., Doc Date, Created By, Buyer, Vendor, Vendor Name, Deletion Ind., Purchase Grp. + Desc, Material + Desc, SLoc, UOM, PO Qty, PO Value, MIGO Qty, MIGO Value, Run on, Delivery Date, Days.
- Load the rows one time, matching on PO + PO Item. The original row is kept as raw data, so a later SAP sync updates the same lines.
- Also provide an SQL file so the same data can be loaded into Quality and Production.

## 3. Screen look matches Purchase Register
- Radiant KPI tiles in the Purchase Register style: Total PO Value, MIGO Value, Open Value and PO/Line count, all in Cr without the "Cr" label, as on Purchase Register.
- Filters bar, plant analytics bars (plant short name), Top Vendors and Top Materials (names only), Material Group summary and delivery aging, using the same card styles.
- The detailed table, with search, pagination and Excel/PDF downloads named "Open Purchase Orders_DD-MM-YYYY".

## Technical details
- `sap-api.tsx`: branch on endpoint name; nested DOCUMENT_DATE get/set helpers.
- Data load runs as an insert from the parsed sheet through the database tool, plus `supabase/migrations/<ts>_open_po_seed.sql` mirror for self-hosted.
- Reuse Purchase Register card and radiant components inside `open-purchase-orders` dashboard.
- Tests: payload keeps PLANT and custom DOCUMENT_DATE; Excel header mapping.
