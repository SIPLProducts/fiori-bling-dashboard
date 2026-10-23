# New Purchase Module

## What you will see
- A new **Purchase** section on the launchpad, placed directly after Sales & Distribution, with its own tab in the module bar.
- Three cards: **Purchase Register**, **Purchase Orders**, **Open Purchase Orders**, styled like the compact S&D cards with an "Open Details" button.
- Each card opens its own page showing a "coming soon" message until the SAP APIs are shared, the same way Asset Register works today.
- Screen Permissions gets a **Purchase** parent row with the three screens as children (tick parent = all three). Sharvi Admin sees everything; Admin gets all three by default.

## Next step after this
Send the SAP API address, request body and a sample response for each of the three, and each page will be turned into a live dashboard (table, filters, charts, Excel/PDF, Sync button).

## Technical details
- `src/lib/screens.ts`: add `module.mm` permission module (groupKey `purchase`) with children `mm.purchase-register`, `mm.purchase-orders`, `mm.open-purchase-orders` and tile keys.
- Routes: `/reports/mm/purchase-register`, `/reports/mm/purchase-orders`, `/reports/mm/open-purchase-orders`, each using `ReportShell` + `ModuleComingSoon` + `hasScreen` guard and its own head().
- Launchpad: add `purchase` to section meta/titles and ordering right after `sales-distribution` (`nav.ts` ordering), render with the S&D compact card grid.
- Migration: insert `tile_groups` row `purchase`, three `tiles` with screen keys, and `role_screens` grants for the admin role (idempotent `WHERE NOT EXISTS`); mirror in `supabase/migrations/` and `deploy/purchase/install-purchase-module.sql` for Quality/Production.
- Test: permission catalog lists the three Purchase children under the Purchase module.
