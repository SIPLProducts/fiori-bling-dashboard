# Add ZPC GROUP and Valuation Class Wise Subgroup to Tables Master

Two new screens under Tables Master, working exactly like ZKEYRM: upload Excel, see the sheet's columns, search, page through rows, add/edit/delete rows or a whole sheet, and download Excel.

## What you will see
- Tables Master menu and launchpad: **SAP MASTER, ZKEYRM, ZPC GROUP, Valuation Class Wise Subgroup** (each with a row count on the launchpad card).
- Each screen shows, per uploaded sheet: **Created on** (first upload) and **Last updated on** (latest upload/edit), in IST.
- Each row in the table also shows **Created** and **Updated** date-time columns, also included in the Excel download.
- User Management gets two new permissions so access can be given per role.
- Each screen's data is kept separate from ZKEYRM and SAP MASTER.

## Technical details
- Reuse sap_masters / sap_master_rows with new categories `zpc_group` and `valuation_subgroup` (MasterCategory type extended).
- Extract the ZKEYRM page into a shared master-screen component parameterised by category, title and permission key; ZKEYRM keeps its current behaviour.
- New routes: `/reports/tables/zpc-group`, `/reports/tables/valuation-subgroup`; screen keys `tables.zpc-group`, `tables.valuation-subgroup` in screens.ts; launchpad Tables Master filter includes them.
- Migration (Cloud + timestamped supabase/migrations copy): add `created_at timestamptz default now()` to sap_master_rows (backfill from updated_at), add `updated_at` to sap_masters set on every upload/edit; upsert keeps created_at, refreshes updated_at; register tiles + screen permissions for the two screens.
- Update sap-master tests for the new categories.
