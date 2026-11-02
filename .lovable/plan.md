# ZRMMAT: why rows are still missing

## What the data shows
- ZRMMAT sheet "Data" still has only **5 rows**, key column **Plant**.
- Its last upload was at **18:45 IST**. The fix that keeps every row went in at about **18:48 IST**.
- So no upload has been done since the fix. The 5 rows on screen are left over from the old upload.

## What to do (no code change needed)
1. Reload the preview page so the new upload dialog loads.
2. On ZRMMAT, click **Upload** and pick the same Excel file.
3. In the dialog, keep **"No key – keep every row"** ticked. The line under it should read "N rows in file → N will be stored".
4. Click **Save**. The old 5 rows are replaced by every row from the file.

Note: the fix is only in the preview for now. The live site (mis.siplproducts.com) and the Quality/Production servers need a publish or deploy before they get it.

## If rows are still missing after re-upload
I'll compare the row count in the file with the stored count and fix the upload step in the same turn. Likely causes to check: blank rows skipped, or a header row that isn't on row 1.
