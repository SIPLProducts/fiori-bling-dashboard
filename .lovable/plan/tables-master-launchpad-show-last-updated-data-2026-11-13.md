# Tables Master launchpad: show last updated data

## What you will see
Each Tables Master card on the launchpad (SAP MASTER, ZKEYRM, ZPC GROUP, Valuation Class Wise Subgroup, Month Wise Upload) shows, instead of just "Open":
- **Last updated:** date & time in IST of the latest upload/edit
- **Rows:** total rows stored (and sheet count for sheet-based masters)
- Month Wise Upload also shows the **latest month/year** uploaded (e.g. "Oct 2026").
- If nothing is uploaded yet: "No data uploaded".
Values load once with the launchpad and change only on Refresh (no auto refresh).

## Technical details
- Add a small launchpad query: for sap_masters, group by category -> max(updated_at), sum(row_count), count(*); for month_wise_upload, latest (year, month), max(updated_at) and row count for that month (head count query).
- Map screen_key -> category (tables.sap-master -> sap_master, tables.zrmmat -> zrmmat, etc.) in a pure helper with a test.
- Pass value/note into the existing TableStatusTile; ZFISALES tile unchanged. Not shown in PDFs.
