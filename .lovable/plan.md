# Load 32,543 Excel records into zfisales_detail

## What the file contains

`ZFISALES_MIS_31.08.2026-2.xlsx` — 32,543 rows, 59 columns, posting dates from 01-Jan-2025 to 28-Aug-2026. The table today holds 649 rows (28-Aug-2025 to 09-Jun-2026) from the SAP sync.

## What will happen

- The Excel rows are loaded into `zfisales_detail`. The 649 existing rows stay; a row that already exists is updated, a row that is new is added.
- Duplicates are removed: the 1,330 rows repeating the same G/L + Fiscal Year + Document No + Document Item collapse to one row each (last value in the sheet wins), so roughly 31,200 unique rows land in the table.

- Rows are marked with source `excel-import` so Excel-loaded data can be told apart from live SAP rows later.
- After loading, the Sales & Distribution dashboard will immediately show the full Jan-2025 to Aug-2026 history — no code or UI change is needed, it reads the same table.

## Field mapping

Excel columns map onto the existing table columns: G/L, GLName, ProfitCtr + names, PC Short Name, Main/Sub Group, Group, New_Repl, Sales type, Customer + name, Fiscal Year, Division + name, Industry Code + name, Document No, Document Item, Sales Office, Doc Date, Posting Date, SH Country key/name, Sales Doc.No./Item, Material + description, Material ProfitCtr + name, UOM, Qty, AH, Total AH, Model, Range, Type, Month, Reference, Type.1 (doc type), PK, Amount in local cur., Segment, Sales Employee + name, Sales Zone, Incoterms, Customer profile, Usage(Application).

Two things to note:

- The file has no Plant or Company Code column, so those two fields stay empty for imported rows (the SAP feed does supply them).
- Amounts are loaded exactly as they appear in the file, including negative revenue signs, so totals match the sheet.
- Columns with no matching table field (Postive/Negative Plates, Width, Cont Ref, Stack/Cell, Cell Type, Stage, Combination, BP Country key) are preserved in the row's raw JSON, so nothing from the sheet is lost.

## Technical notes

- Parse the workbook in the sandbox with pandas, normalise dates to `YYYY-MM-DD`, numbers to numeric, blanks to null.
- `record_key` = `gl|fiscal_year|doc_no|doc_item|occurrence`, occurrence counted per duplicate group, so all 32,543 rows survive the unique key.
- Insert via batched `INSERT ... ON CONFLICT (record_key) DO UPDATE` (~500 rows per statement, ~65 batches) using the data-change tool.
- Verify afterwards with a count and a posting-date range check, and spot-check the SD dashboard totals.
