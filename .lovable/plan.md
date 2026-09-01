# Posting dates + live SD Sales & Distribution dashboard

## 1. Posting date pickers (SAP API Settings → Request)

Confirmed in the code: To Date is only backfilled when the saved payload key is missing or malformed, and your saved payload contains `"BUDAT_T": ""`, which the current cleanup path can leave blank on screen.

Changes:
- When an endpoint form opens, always resolve blank/invalid `BUDAT_T` to **today** and blank/invalid `BUDAT_F` to **today − 7 days**, writing the values straight into the Request payload so both pickers are pre-filled.
- Both pickers stay fully editable; whatever you set is saved verbatim and sent by Test connection and by the 10-minute sync.
- If a saved payload still has an empty date at send time, the server fills the same defaults so a sync never goes out with an empty `BUDAT_T`.

## 2. Store the richer SAP response

The sample response carries useful fields the table does not keep yet. Add columns to `zfisales_detail` and map them during sync (existing rows and data untouched):

quantity (`MENGE`) + unit (`MEINS`), division (`SPART`), industry (`BRSCH`), sales office/plant text (`VTEXT`), branch (`BRTXT`), country (`LAND1`, `LANDX50`), model (`MODEL`), product type (`TYPE`), range (`RANGE`), product group (`PCGRP1`), main group (`MNGRP1`), customer group description (`KDGRP_DESP`), usage (`ABRVW_DESP`), sales org description (`SALES_ORG_DESP`), incoterms (`INCO1`), sales rep (`LIFNR`, `NAME11`), total AH (`TOT_AH`).

Sync stays additive: received rows are inserted or updated by the existing key `WERKS|GJAHR|BELNR|POSNR|HKONT`; nothing is deleted, and an empty API response changes nothing.

## 3. SD — Sales & Distribution screen on live data

Replace the mock module report on the SD screen with `zfisales_detail` data, in the portal's Fiori style:

Smart filter bar (collapsible, chips): posting date range with quick presets, fiscal year, company/plant, profit centre, sales type (Domestic / Exports / Service), segment, product group, country, customer search.

KPI cards: Total revenue (with Domestic / Export / Service split bars), Documents, Customers, Average value per document, Total quantity, Top profit centre — each with tone-coloured accent and trend caption.

Charts:
- Revenue trend by month (area) with document count line
- Revenue by profit centre (horizontal bar)
- Sales mix by type (donut) and by segment (donut)
- Top 10 customers (bar)
- Top 10 materials / product groups (bar)
- Revenue by country (bar) — from the export data in the response

Drill-down table: all document lines with search, column set matching the response (document, item, posting date, customer, material, description, quantity, amount, profit centre, sales type, country) and CSV export.

Empty state when the table has no rows for the filters, plus a "Source: ZFISALES_DETAIL · last synced <IST time>" caption.

## Technical notes

- Migration adds nullable columns to `public.zfisales_detail`; grants and RLS unchanged.
- `src/lib/zfisales-sync.server.ts`: extend `mapRow` with the new field mappings.
- `src/lib/zfisales-synced.ts` / `zfisales.ts` / `zfisales-types.ts`: widen the row type and aggregations (quantity, country, product group, material).
- New route content for the SD module screen reading through a server-side query over `zfisales_detail`; other module screens keep their current behaviour.
- `src/routes/_authenticated/admin/sap-api.tsx`: fix `withDefaultDates` so empty strings are treated as missing and defaults are written back to the payload.
- All colours from existing semantic tokens; timestamps via `formatDateTimeIST`.
