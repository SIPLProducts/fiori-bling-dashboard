# SAP Master screen (Tables Master module)

## What you get
- A new **Tables Master** section on the Launchpad with one tile: **SAP MASTER**.
- On SAP MASTER, admins upload an Excel file. **Every sheet in the file becomes its own master list**, named after the sheet (e.g. "Plant", "Customer").
- Columns come straight from the sheet's header row. If a later upload has new columns, they are added automatically; old columns stay.
- Re-uploading **adds new rows and updates matching rows**. On upload you pick the key column (defaults to the first column) used to match rows.
- Screen shows a master picker, a searchable, paginated, horizontally scrollable table of that master, row/column counts, last upload time, and an Excel download.
- View only: no on-screen editing or deleting. Only admins see the Upload button; others with screen permission can view.
- Later, any screen's dropdown can read from a chosen master + column (you tell me which screens).

## Steps
1. Database: one table for master lists (name, columns list, key column, last upload) and one for rows (master, key value, row data as flexible fields), unique on master + key. Admin-only write, screen-permission read. Mirror the change in the self-hosted migrations folder.
2. Launchpad group "Tables Master" + tile "SAP MASTER" with permission key `sap_master`, granted to admins.
3. Upload flow: read the Excel in the browser, preview sheets and columns, choose key column per sheet, then save in batches with a progress bar.
4. Viewer: master picker, search, pagination, Excel export named "SAP MASTER_DD-MM-YYYY".
5. Shared helper so other screens can load dropdown options from a master column.
6. Tests for the merge rule (new rows added, matching rows updated, new columns appended).

## Technical details
- Tables `sap_masters` and `sap_master_rows (master_id, key_value, data jsonb)` with upsert on (master_id, key_value); `data` merged so missing cells don't wipe existing values.
- RLS: write via `is_data_admin(auth.uid())`, read via `has_screen(auth.uid(),'sap_master')`; grants to authenticated/service_role.
- Excel parsed client-side with the existing xlsx library; batches of 500 rows.
