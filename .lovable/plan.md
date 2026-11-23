# SO Ageing screen (Sales & Distribution)

Uses the ZAGEING1_NEW SAP API (POST /zageing1_new/ageing?sap-client=234). It syncs like the other SAP screens.

## What you will see
- **Filters** (they match the SAP screen): Plant, Material, Material Type, Material Group, Storage Location, Key Date (default today), and the Ageing buckets (default 90 / 180 / 365 days). Each has Clear and Reset.
- **Tiles**: Closing Stock Value (₹ Cr), Closing Qty, 0–90 days value, 91–180, 181–365 and >365 (₹ Cr), and Last Sync (IST).
- **Cards** (radiant colours, same style as the other screens):
  - Ageing Bucket donut (value per bucket)
  - Plant Wise Ageing (bars, plant short name, split by bucket)
  - Top 10 Storage Locations (SNAME)
  - Top 10 Materials by >365 days value
  - Profit Centre Wise Ageing
- **Detailed table**: Plant, Plant Name, Storage Location and Description, Material and Description, UoM, Batch, Material Doc / Year, Document Date, Profit Centre, the quantity and value for each of the 4 buckets, Closing Qty and Closing Value. Values and quantities show in full, with column search, pagination, a totals row and Excel. The table is left out of the PDF.
- **PDF** with the HBL header and full-width rows. The file is named "SO Ageing_DD-MM-YYYY".
- The bucket headings follow the bucket days you set (for example 0–90, 91–180, 181–365, >365).

## Technical details
- Migration (also mirrored in supabase/migrations): table public.so_ageing. It stores every response field as a typed column (werks, plant_name, lgort, sname, matnr, maktx, meins, buck1..4, valu1..4, cl_stck, price, mblnr, mjahr, bldat, charg, prctr) plus the raw row, the key date and the sync time. RLS uses permission key sd.so-ageing and plant/profit-centre scoping like the other screens. A sap_endpoints row is added with a default payload.
- Sync: the response is a snapshot as of P_BUDAT. After a successful reply, the old rows are replaced with the new set in one transaction. Empty or failed replies keep the current rows. P_BUDAT is the date in YYYYMMDD format (scheduled runs use today). P2_BKT1-3 are zero-padded to 4 digits.
- New files: src/lib/so-ageing-map.ts (mapper), src/lib/so-ageing-data.ts (pure totals/rollups and a test), src/components/so-ageing-dashboard.tsx, and the route under reports/sd. A launchpad tile and a permission entry are added. The sync-core.mjs branch is added so the self-hosted scheduler supports it.
