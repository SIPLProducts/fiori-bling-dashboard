# ZRMMAT: keep all uploaded rows

## Why only 5 rows show
The sheet was uploaded with **Plant** chosen as the key column. Your file has 200+ rows but only 5 different plants, so each new row with the same plant replaced the one before it. Only the last row per plant stayed (5 rows). The screen shows up to 50 rows per page, so the screen itself is not the limit.

## Changes
1. **Key choice in Upload dialog becomes multi-select.** Pick one or more columns (e.g. Plant + Material) together as the key, so rows are unique on the combination.
2. **New option "No key – keep every row"** (default for ZRMMAT). Every Excel row is stored as-is. Re-uploading replaces that sheet's rows completely, so you don't get duplicates.
3. **Duplicate warning before upload.** The dialog shows "200 rows in file → 5 unique keys" and asks you to confirm or pick another key, so this can't happen silently again.
4. **Edit / Delete keep working** for every row (uses the row's own id when there is no key).
5. After the change, re-upload your Excel once to get all 200+ rows.

## Technical details
- `sap_masters.key_column` stores a `+`-joined list of columns, or `__row__` for no key; key value = joined cell values or the row's position.
- "No key" upload: delete existing rows for that master, then insert in batches of 500 (inside the existing admin-only write path).
- Pure helper `buildKey(row, keyCols)` + `countUniqueKeys` with unit tests (200 rows / 5 plants → 5; Plant+Material → unique count; no key → 200).
- SAP MASTER keeps its current behaviour; it gets the same multi-column option.
