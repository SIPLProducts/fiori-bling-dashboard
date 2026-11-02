# ZRMMAT screen in Tables Master

## What you get
- A new **ZRMMAT** tile in the Tables Master module, next to SAP MASTER. It has its own route and permission so you can assign it in Roles.
- It works the same way as SAP MASTER:
  - Upload an Excel file and pick the sheet and the key column.
  - The rows are saved and any new columns are added automatically.
  - Search, pages and Excel download work as they do on SAP MASTER.
- New on this screen, for admins only:
  - **Edit**: a pencil on each row opens a form with every column. Save updates that row.
  - **Delete**: a bin icon on each row, with a confirmation.
  - **Delete selected**: tick rows with the checkboxes, then delete them together.
  - **Delete sheet**: removes the whole uploaded sheet and all its rows.
  - **Add row** (optional): add a single row by hand.
- Users without admin rights can only view and download.
- ZRMMAT data is kept separate from SAP MASTER, so uploads in one never show up in the other.

## Technical
- Migration:
  - Add a `category text not null default 'sap_master'` column to `public.sap_masters`, so existing rows stay SAP MASTER.
  - Make the name unique per category.
  - Add a delete policy on `sap_master_rows` and `sap_masters` for `is_data_admin`. Update the update policy if it is missing.
  - Insert the `table_zrmmat` tile into `public.tiles`.
  - Mirror the migration in `supabase/migrations` for Quality and Production.
- `sap-master.ts`:
  - Add an optional `category` parameter to the list, upload and option helpers.
  - Add `updateMasterRow(id, data)`, `deleteMasterRows(ids)` and `deleteMaster(id)`.
- `screens.ts`: add `tables.zrmmat` (label "ZRMMAT", tileKey `table_zrmmat`).
- Pull the SAP MASTER screen into a shared `MasterTableScreen` component with `category`, `title` and `editable` props.
  - `sap-master.tsx` uses it with editing off, so it stays unchanged.
  - The new `tables/zrmmat.tsx` uses it with editing on.
- Add a unit test for `mergeMaster` and the edit and delete helpers.
