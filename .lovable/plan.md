# Align Quality with the current local portal

## Confirmed issue

- The Screen Permissions screenshot confirms Quality is running the current hierarchical permission code: Sales & Distribution, Financial Accounting, Production Planning, and Tables Master are structured correctly there.
- The launchpad does not build its module tabs and cards from that permission list. It separately reads `tile_groups` and `tiles` from the Quality database.
- Quality still contains legacy rows in those tables, which is why retired module tabs and Sales & Distribution cards appear even though Screen Permissions is correct.
- The cleanup changes exist only as standalone deployment SQL (`remove-retired-screens.sql`, `remove-sd-summary-cards.sql`, and `fix-open-sales-orders-route.sql`). The Quality migration service applies files under `supabase/migrations`, so these scripts were missed.

## Correction

1. Apply the three pending launchpad SQL updates to the Quality database:
   - remove the nine retired modules and their old permissions;
   - remove Billed Revenue, Net Sales, Backorders, Sales Trend, Billing Documents by Month, and the old Sales Analytics launch card;
   - point Open Sales Orders to its dedicated report.
2. Move these data corrections into an idempotent migration so future Quality and Production upgrades apply them automatically.
3. Reload the database API schema, sign out/in or hard-refresh, and verify the module tabs, Sales & Distribution cards, and Open Sales Orders destination.

## Validation

- Quality shows the HBL logo with only `MIS PORTAL` beside it.
- The selected module uses the white bottom-border state.
- Retired module tabs and retired Sales & Distribution cards are absent.
- Sales & Distribution contains only Total Sales and Open Sales Orders.
- Sales & Distribution cards have the current equal-width layout.
- Only each card’s action button opens its report.
- Open Sales Orders opens `/reports/sd/open-sales-orders`.
- Local and Quality show the same launchpad for the same user and permissions.
