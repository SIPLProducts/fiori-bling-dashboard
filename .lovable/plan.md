# Purchase Register — live SAP data (ZPUREGST)

## What you will get
1. **New SAP API "Purchase Register"** added automatically in SAP API Settings (I add it, you don't need to):
   - POST `/zpurereg/list?sap-client=234`, same SAP system/credentials as the other APIs.
   - Request body `{ "BUDAT_F": "YYYYMMDD", "BUDAT_T": "YYYYMMDD" }`.
   - Date window dropdown works like Net Sales: rolling presets (e.g. current FY, current month) recompute every scheduled run; custom dates stay fixed; only BUDAT_F/BUDAT_T change.
2. **New table `purchase_register`** storing every field from the response (all 42 SAP keys, typed) plus the full raw row and sync time.
   - Each sync updates existing lines and adds new ones, keyed on Invoice Doc (BELNR) + Item (BUZEI) + Material Doc (MBLNR) + Item (ZEILE).
3. **Purchase Register screen filters**: add **Posting Date From** and **Posting Date To** (on BUDAT). Sync button (Admin / Sharvi Admin) calls this API with those dates.
4. **Migration files** for your Quality/Production servers: `deploy/purchase/install-purchase-register.sql` (table + security + API registration, safe to rerun) and a matching Cloud migration.

Screen cards stay on the current sample figures in this step; switching them to live table data is a follow-up once data lands (tell me if you want it in this same step).

## Technical details
- Migration: `public.purchase_register` (werks, name1_wer, prctr, ptext, lifnr, name1, budat date, mtbez, matnr, maktx, belnr, buzei int, menge_i numeric, meins_i, mwskz, text1_m, bwart, aedat date, mblnr, zeile int, meins_g, menge_g, wrbtr, waers, kursf, dis, oth, plan_del, tax, sgst, cgst, igst, no_cr, gl_acc, total, net_amt, gross_price, net_price, shkzg, ty_purch, ty_mat, create_dt date, raw jsonb, synced_at), unique (belnr, buzei, mblnr, zeile) with blank defaults; GRANTs; RLS select for authenticated using `user_can_see(werks, prctr)`; index on budat. Insert `sap_endpoints` row (WHERE NOT EXISTS).
- `src/lib/purchase-register-map.ts` pure mapper (SAP dates "YYYY-MM-DD"/"YYYYMMDD", numeric normalization) + test.
- `sap-pull.server.ts` + `middleware/sync-core.mjs`/`scheduler.mjs`: route endpoint to `storePurchaseRegisterPayload`; `withPostingDates` sets BUDAT_F/BUDAT_T from range (reuse Net Sales helper).
- Filters component: two date inputs; SyncNowButton endpoint "Purchase Register".
- Note: the PDF contains SAP user/password — I will not put them in code; the existing SAP credential store is used.
