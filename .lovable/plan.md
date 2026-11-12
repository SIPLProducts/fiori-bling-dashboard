# Purchase Orders: Purchasing Group description (EKGRP_DESC)

## What changes
- SAP now sends `EKGRP_DESC` (e.g. "PurGroup-NCPP") with each PO line. It will be saved with every line.
- **PO Value by Purchasing Group** card shows the description instead of the code (code shown only if the description is empty).
- Purchasing Group filter, detailed table and Excel also show the description (code kept as its own column in table/Excel). Search includes it.

## Technical
- Migration (Cloud + mirror `supabase/migrations/20261112090000_purchase_orders_ekgrp_desc.sql`): `ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS ekgrp_desc text;` backfill from `raw->>'EKGRP_DESC'`.
- `purchase-orders-map.ts`: map `EKGRP_DESC` → `ekgrp_desc`; rebuild `middleware/sync-core.mjs`.
- `purchase-orders-data.ts`: select `ekgrp_desc`, add `purGroupName`, bump query key; dashboard uses `purGroupName || purGroup`.
- Regenerate types; add a mapper test for `EKGRP_DESC`.
- Quality deployment: run migration + `NOTIFY pgrst, 'reload schema';`, deploy sync-core.mjs, restart PM2, re-sync, upload frontend build.
