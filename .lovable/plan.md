# Store the second Segment column and drive the Sales by Segment card from it

## What the sheet has

The uploaded file (32,543 rows) has two segment columns:

- `Segment` (column AZ) — SAP segment codes: PSGR3000, LEGR2000, PRDI5000, SLDI6000, COFF1000, plus 9,532 blanks. This is what the table stores today, so the donut currently shows codes and a large "Unassigned" slice.
- `Segment.1` (column BF) — the business segment names: Industry (19,703), Power/T&D & Utilities (3,195), Telecom (3,116), Railways (2,691), Oil & Gas (1,140), Automotive, Defence, Scrap, Aviation, Metro, Renewable Energy. Only 1 blank row.

The database table has no field for the second one.

## What will change

1. Add a new field `business_segment` to `zfisales_detail` (the SAP code column stays untouched).
2. Backfill it for all 32,543 sheet rows, matched on the same key already used by the earlier import (G/L + Fiscal Year + Document No + Document Item). Rows not present in the sheet keep an empty value.
3. The **Sales by Segment (Amount)** donut switches to the business segment names, so it reads Industry / Power, T&D & Utilities / Telecom / Railways / etc. with amounts and percentages. Rows with no value show as "Unassigned".

Note: the live SAP feed does not send this business segment, so rows arriving from future syncs will be blank in this field until SAP adds it to the extract. Say the word and I can also map it from the SAP payload once that field exists there.

## Technical notes

- Migration: `alter table public.zfisales_detail add column business_segment text;` plus an index for grouping.
- Backfill: parse the workbook in the sandbox, build `record_key = gl|fiscal_year|lpad(doc_no,10)|doc_item`, and issue batched `UPDATE ... FROM (values ...)` statements (~500 rows per batch).
- `src/lib/sd-live.ts`: add `businessSegment` to `SdLine`/`COLUMNS`, aggregate `bySegment` on it instead of `segment`.
- `src/components/sd-live-dashboard.tsx`: donut label/legend unchanged apart from the data source.
- Verify with a segment-wise count/amount query against the sheet totals.
