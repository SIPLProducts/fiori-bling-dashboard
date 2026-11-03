# Open Purchase Orders (ZOPENPO) — screen, table, SAP API

## Which design fits
**Design 1 (Open Purchase Order Dashboard)** fits your data best. Your Excel/API has PO Value, MIGO (received) Value, Delivery Date and Days — exactly what Design 1 uses (Total PO, Received, Open/Pending, Delivery Aging). Designs 2–4 need data SAP doesn't send (vendor quality scores, completed POs, multi-plant SLoc donuts). Its "Tax & Duty" card is replaced, because ZOPENPO has no CGST/SGST/IGST fields.

## Screen layout (Purchase → Open Purchase Orders)
- **Header:** title, document-date From–To, Sync (admins only), last sync time, Excel / PDF downloads.
- **Filters:** Plant, PO Type, Created By, Main Group, Sub Group, Vendor, Material, Delivery Status, with Reset.
- **4 colour tiles (radiant, like Purchase Register):**
  - Total PO Value (₹ Cr) — NETWR
  - MIGO Received Value (₹ Cr) — DMBTR1
  - Open / Pending Value (₹ Cr) — PO Value − MIGO Value
  - Open POs / Vendors — distinct PO numbers and vendors
- **Charts row 1:** Top 10 Vendors by Open Value · Open Value by Main Group → Sub Group · PO Value by PO Type (donut) · Delivery Aging donut (Not due / 0–30 / 31–60 / 61–90 / >90 days overdue, from delivery date vs today).
- **Charts row 2:** Daily PO Value trend (PO vs MIGO by document date) · Purchase Group overview (EKNAM) · Storage Location spend (LGORT).
- **Details table:** PO Date, PO No/Item, PO Type, Vendor, Main/Sub Group, Material + Description, SLoc, PO Qty, PO Value, MIGO Qty, MIGO Value, Open Value, Delivery Date, Days, Buyer, Status (Open / Partially received / Overdue / Delivery complete). Column search, pagination, Excel download.
- All files named "Open Purchase Orders_DD-MM-YYYY"; works in Light, Dark and Glassy.

## Data storage
New table **open_purchase_order** holding every SAP field typed plus the full raw row. Each sync **replaces the lines in the returned document-date window** keyed on PO + PO Item (lines no longer open are removed), so closed POs don't linger.

## SAP API Settings
New endpoint **Open_Purchase_Order** (POST `/openpo/openpo?sap-client=234`) with the request payload from your PDF prefilled. DOCUMENT_DATE FROM/TO follow the date-window choice (Previous date, Last 7 days, FY to date, etc.); PLANT, VENDOR, MATERIAL, DELIVERY_DATE optional. Credentials entered in settings — not stored in code.

## Technical details
- Migration (Cloud + mirrored `supabase/migrations/2026110300000_open_purchase_order.sql`): table with columns werks, plt_name, bsart, lgort, ekgrp, ebeln, ebelp, elikz, bedat(date), lifnr, name1, loekz, matnr, txz01, menge, meins, netwr, menge1, meins1, dmbtr1, wrbtr, eindt(date), datum(date), lv_menge_sum, days, eknam, buyer, creat, mngrp1, pcgrp1–3, raw jsonb, synced_at; unique (ebeln, ebelp); indexes on bedat, werks; GRANTs; RLS read via `has_screen('mm.open-purchase-orders') AND user_can_see(werks, null)`, write for super admin/service role. Seed `sap_endpoints` row + tile entry where missing.
- `src/lib/open-po-map.ts` mapper (DD.MM.YYYY / YYYY-MM-DD dates, numbers, `sapGroupColumns` for MAIN_GRP/MNGRP1 aliases) + tests; registered in sap-pull and `sync-core.entry.ts`, rebuild `middleware/sync-core.mjs`.
- `src/lib/open-po-data.ts` (paged parallel reads, stable query, explicit Refresh) + pure aggregate helpers with tests (open value, aging buckets, status).
- Replace the coming-soon route with the dashboard component.
- After this, Quality/Production need: run the new migration SQL, copy new sync-core.mjs, `pm2 restart`.
