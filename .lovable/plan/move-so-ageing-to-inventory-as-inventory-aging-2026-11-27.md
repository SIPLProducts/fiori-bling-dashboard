# Move SO Ageing to Inventory as "Inventory Aging"

## What changes for you
- The SO Ageing screen and its launchpad tile leave Sales & Distribution and appear under **Inventory**, named **Inventory Aging** (menu, tile, screen title, PDF/Excel file names).
- Everything on the screen (filters, tiles, cards, table, Excel, PDF) and the stored data stay exactly as they are.
- In SAP API Settings the API is renamed from "SO_Ageing" to **"Inventory Aging"**; its URL, payload and schedule are unchanged, and sync keeps working.
- Users who could see SO Ageing keep access to Inventory Aging automatically.
- The old address keeps working by sending people to the new one.

## Technical details
- New route `src/routes/_authenticated/reports/inv/inventory-aging.tsx` (same content as sd/so-ageing.tsx, renamed titles/head/datedFileName); old sd/so-ageing.tsx becomes a redirect.
- `screens.ts`: move entry to Inventory group, key `inv.inventory-aging`, label "Inventory Aging", tileKey `inv_inventory_aging`; tile-card icon mapping updated.
- Launchpad: SoAgeingTile title "Inventory Aging", matched on new screen_key, default href new path.
- Migration (mirrored in supabase/migrations): update `tiles` row (screen_key, module/group, title, target_path), copy role_screens / user permissions from `sd.so-ageing` to `inv.inventory-aging`, update so_ageing RLS policies to accept the new key, rename the sap_endpoints row name to "Inventory Aging".
- Sync detection (`isSoAgeingEndpoint`, scheduler.mjs, sync-core.mjs) matched on URL path `/zageing1_new/` plus both names, so old and renamed endpoints both sync; rebuild sync-core.mjs. Table public.so_ageing unchanged.
- Update tests; verify screen loads under Inventory with Playwright.
- Self-hosted: run migration, copy scheduler.mjs + sync-core.mjs, pm2 restart MIS_QTY, rebuild static.
