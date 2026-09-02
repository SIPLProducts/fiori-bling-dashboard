# Reload zfisales_detail from the new sheet, with both Segment columns

## What the sheet has

The uploaded file (32,543 rows) has two segment columns:

- `Segment` (column AZ) — SAP segment codes: PSGR3000, LEGR2000, PRDI5000, SLDI6000, COFF1000, plus 9,532 blanks. This is what the table stores today, so the donut currently shows codes and a large "Unassigned" slice.
- `Segment.1` (column BF) — business segment names: Industry (19,703), Power/T&D & Utilities (3,195), Telecom (3,116), Railways (2,691), Oil & Gas (1,140), Automotive, Defence, Scrap, Aviation, Metro, Renewable Energy. Only 1 blank.

The database has no field for the second one.

## What will happen

1. Add a new field `business_segment` to `zfisales_detail` (the SAP code field stays as-is).
2. **Delete every existing row** in `zfisales_detail` (currently 31,862 rows, mix of earlier Excel import and SAP sync).
3. Re-load all rows from the uploaded sheet — after collapsing duplicate keys (G/L + Fiscal Year + Document No + Document Item), roughly 31,200 unique rows — with all mapped fields including both segment columns and Customer profile.
4. **Sales by Segment (Amount)** switches to the business segment names, so it reads Industry / Power, T&D & Utilities / Telecom / Railways / etc. with amounts and percentages.

Note: the live SAP feed does not send the business segment today, so rows arriving from future syncs will be blank in that field until SAP includes it. Deleting and reloading means the table holds exactly what the sheet holds until the next SAP sync runs.

## Technical notes

- Migration: `alter table public.zfisales_detail add column business_segment text;` plus an index on it.
- Wipe + reload via the data tool: `delete from public.zfisales_detail;` then batched `INSERT ... ON CONFLICT (record_key) DO UPDATE` (~500 rows per statement), `source_endpoint = 'excel-import'`, unmapped sheet columns kept in `raw`.
- `record_key = gl|fiscal_year|lpad(doc_no,10)|doc_item`, matching the existing convention.
- `src/lib/sd-live.ts`: add `businessSegment` to `SdLine`/`COLUMNS`; aggregate `bySegment` on it instead of `segment`.
- Verify row count, posting-date range, total amount, and segment-wise totals against the sheet.
