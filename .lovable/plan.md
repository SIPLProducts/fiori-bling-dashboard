# Purchase Register: show live synced data

The table now holds 3,771 synced lines (posting dates 01.06.2026 – 10.06.2026). The screen will read these rows instead of the empty sample figures.

## What the user will see
- Header: "Data available: DD.MM.YYYY – DD.MM.YYYY" from the stored posting dates, plus Refresh, Sync and PDF.
- All existing cards are filled from real data, layout unchanged:
  - Total Purchase and Domestic / Imported / Service tiles (TY_PURCH)
  - Monthly trend (April–March FY) and quarterly comparison vs previous year
  - Top Materials (MATNR + MAKTX), Top Vendors (LIFNR + NAME1)
  - Material Group donut and summary table (TY_MAT, e.g. Raw Material, Others, Imported)
  - Plant (WERKS + NAME1_WER) and Profit Centre (PRCTR + PTEXT)
- Filters (Year, Plant, Type, Material Group, Month, Posting Date From/To) filter the real rows; donut/table clicks still filter.
- Values shown in ₹ Cr.

## Question to confirm
Amount key: **NET_AMT** (net, before tax; e.g. 21.39 Cr Domestic Raw Material) or **TOTAL** (incl. tax; 24.82 Cr). Plan defaults to **NET_AMT** unless you say TOTAL.

## Technical details
- New `src/lib/purchase-register-data.ts`: paginated read of all `public.purchase_register` rows via one stable query (explicit Refresh only), plus pure aggregation helpers replacing the sample constants.
- `purchase-register-dashboard.tsx` consumes the query and helpers; sample file kept only for types/month list.
- Credit-note lines (SHKZG = H) subtract from totals.
- Tests in `tests/purchase-register-data.test.ts` for type totals, top-N ranking, FY month bucketing.
