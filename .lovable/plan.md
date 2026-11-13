# Tables Master: new "Month Wise Upload" screen

## What you will see
- New screen **Month Wise Upload** under Tables Master, with its own launchpad card and its own permission in User Management.
- Top bar: **Month** dropdown (April ... March), **Year** dropdown, and an **Upload Excel** button.
- After upload, the table shows the Excel columns exactly as in your file:
  Plnt, Location, Material, Material Description, Profit Centre, SAC/HSN Code, MTyp, ValCl, Val. Type, BUn, OB Qty, OB Val, RCPT Qty, RCPT Val, ISS Qty, ISS Val, CB Qty, CB Val, G/L Acct, Gl Description, Price, Std price, Pr., Matl Group
- Plus extra columns added automatically: **Month**, **Year**, **Created Date**, **Updated Date** (IST).
- Choosing a Month/Year shows only that month's rows; search, pagination, edit/delete row and Excel download work like ZKEYRM. Download includes the extra columns.

## Upload rules
- Upload is tagged with the selected Month + Year.
- Uploading again for the same Month + Year replaces that month's rows (other months untouched); Created Date is kept, Updated Date changes. A confirm prompt appears before replacing.
- Empty rows are skipped; codes like Material / G/L Acct / Plnt are kept as text (no lost leading zeros).

## Technical details
- New table `month_wise_upload` (id, month int, year int, data jsonb, created_at, updated_at, created_by), index on (year, month); GRANTs + RLS using the existing tables-master permission helper with new key `tables.month-wise-upload`.
- Migration via Cloud tool + mirrored file in supabase/migrations.
- Reuse the ZKEYRM/ZPC upload page pattern (SheetJS parse, dynamic columns); add screen to src/lib/screens.ts and a launchpad tile.
