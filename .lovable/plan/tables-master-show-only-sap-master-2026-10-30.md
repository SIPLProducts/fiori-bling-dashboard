# Tables Master: show only SAP MASTER

## Why SAP MASTER is missing
The Tables Master section on the Launchpad only shows tiles whose link starts with `/tables/`. SAP MASTER opens at `/reports/tables/sap-master`, so it is skipped. The section also always shows four fixed placeholder tiles (Customer, Material, Vendor, Plant masters).

## Changes
1. Launchpad Tables Master section shows only the SAP MASTER tile (opens the upload screen).
2. Remove the four fixed placeholder tiles (Customer / Material / Vendor / Plant Master) and the ZTBN / ZFISALES Detail / other table tiles from this section.
3. Screen Permissions: Tables Master lists only SAP MASTER.
4. Old table screens stay reachable by direct link (nothing deleted from the database), so TBN and sync are unaffected.

## Technical details
- `src/routes/_authenticated/launchpad.tsx`: in the `tables-master` branch drop the `PlaceholderTile` row and render only tiles with `screen_key === "tables.sap-master"` via `TableStatusTile` (href = target_path, value "Open").
- `src/lib/screens.ts`: Tables Master children reduced to `tables.sap-master`.
- No migration; tile rows are only hidden in the UI.
- Quality/Production: deploy the updated app; SAP MASTER needs the `sap_master` migration already run there.
