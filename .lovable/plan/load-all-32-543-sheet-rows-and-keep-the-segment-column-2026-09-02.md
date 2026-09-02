# Load all 32,543 sheet rows and keep the Segment column

## Why the table shows 31,212 instead of 32,543

Verified against the uploaded sheet and the database:

- The sheet has 32,543 data rows, but only 31,213 unique business keys (G/L + Fiscal Year + Document No + Document Item). 1,330 rows repeat a key that already appears earlier in the sheet.
- The import uses that key as `record_key` with "last one wins", so those 1,330 repeats overwrote each other instead of being added.
- One more row was the sheet's grand-total row (blank document no), which was dropped.

31,213 unique keys − 1 total row = 31,212 rows currently stored. The database confirms 31,212 rows, all with a business segment filled in.

Important: the repeated rows are not identical copies — they carry their own amounts and quantities, so dropping them understates the totals.

## What will change

1. Make the row key unique per sheet line: `record_key` becomes `G/L|Fiscal Year|Document No|Document Item|<line number>` so every line of the sheet gets its own row. No sheet line is collapsed.
2. Wipe `zfisales_detail` and reload all 32,542 data rows (the grand-total row stays excluded, since it would double every KPI).
3. The new `business_segment` field (Segment column BF of the sheet) is loaded for every row, as it is today, and the dashboard's Segment table column and "Sales by Segment (Amount)" donut keep reading it.
4. Verify after loading: row count = 32,542, total amount matches the sheet's own sum, segment-wise totals match.

## Note on future SAP syncs

Live SAP rows keep their own key (plant + year + doc + item + G/L), so they are unaffected by this change. SAP still does not send the business segment, so rows arriving from a future sync will be blank in that field until the SAP extract includes it.

## Technical notes

- Parse the workbook with pandas, keep sheet order, append a zero-padded row index to the record key.
- Delete existing rows, then bulk-load via CSV `COPY`-style batched inserts with `source_endpoint = 'excel-import'`; unmapped sheet columns stay in `raw`.
- No UI code change required — `src/lib/sd-live.ts` and `sd-live-dashboard.tsx` already surface `business_segment`.
