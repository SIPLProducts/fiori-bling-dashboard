# Align Quality with the current local portal

## Confirmed issue

- Quality is serving an older static frontend. The screenshot still shows the previous header, filled module selection, retired module tabs, and retired Sales & Distribution cards that no longer exist in the current source.
- Quality also has older launchpad records in its own database. Module tabs and cards are loaded from `tile_groups` and `tiles`, so replacing only the frontend files cannot remove those records.
- The cleanup changes exist as standalone deployment SQL (`remove-retired-screens.sql`, `remove-sd-summary-cards.sql`, and `fix-open-sales-orders-route.sql`) rather than normal migration files. Therefore the Quality migration container does not apply them automatically.

## Correction

1. Build a fresh Quality static package from the current source using the Quality browser configuration.
2. Replace the complete contents of `/opt/MIS_Projects/Quality/frontend/dist/` with the new package, deleting obsolete hashed assets instead of copying over the old folder.
3. Apply the three pending launchpad SQL updates to the Quality database:
   - remove the nine retired modules and their old permissions;
   - remove Billed Revenue, Net Sales, Backorders, and Sales Trend;
   - point Open Sales Orders to its dedicated report.
4. Move these data corrections into an idempotent migration so future Quality and Production upgrades apply them automatically.
5. Reload the database API schema, hard-refresh the browser, and verify the header, module tabs, Sales & Distribution cards, and Open Sales Orders destination.

## Validation

- Quality shows the HBL logo with only `MIS PORTAL` beside it.
- The selected module uses the white bottom-border state.
- Retired module tabs and retired Sales & Distribution cards are absent.
- Sales & Distribution cards have the current equal-width layout.
- Only each card’s action button opens its report.
- Open Sales Orders opens `/reports/sd/open-sales-orders`.
- Local and Quality show the same launchpad for the same user and permissions.
