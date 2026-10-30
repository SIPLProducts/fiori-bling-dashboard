# New module: Inventory

Spelling: the correct word is **Inventory** (and **Inventory Aging**). The plan uses the correct spelling.

## What you will see
- A new **Inventory** section on the Launchpad, with three tiles:
  - Current Stock
  - Month Wise Stock
  - Inventory Aging
- Each tile opens its own screen showing the shared "Coming soon" page, the same as Purchase Orders and Asset Register today. The real data screens get built once you share the SAP API for each one.
- The module and its three screens show up in Screen Permissions, so admins can give access per role and per user, like the other modules.
- Inventory also appears in the top navigation next to the other modules.

## Technical details
- `src/lib/screens.ts`: add `module.inv` (label "Inventory", groupKey `inventory`) with children `inv.current-stock`, `inv.month-wise-stock`, `inv.inventory-aging` and tile keys `inv_current_stock`, `inv_month_wise_stock`, `inv_inventory_aging`.
- `src/lib/sap-modules.ts`, `src/lib/nav.ts`, `src/routes/_authenticated/launchpad.tsx`, `src/components/tile-card.tsx`: register the group, label/subtitle, icon (Boxes/Package) and compact 5-column tile layout.
- Routes: `src/routes/_authenticated/reports/inv/current-stock.tsx`, `month-wise-stock.tsx`, `inventory-aging.tsx` using `ReportShell` + `ModuleComingSoon` + `hasScreen` guard, each with its own head() metadata.
- Migration: insert the `inventory` tile group and three launch tiles into `public.tiles` (idempotent), mirrored in a timestamped `supabase/migrations` file for self-hosted Quality/Production.
