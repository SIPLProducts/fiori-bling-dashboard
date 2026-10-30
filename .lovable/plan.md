# Purchase Register: show PLANT_SH as plant name

## What changes
- Plant card, Plant filter dropdown, detailed table and Excel show the short plant name from SAP's new `PLANT_SH` key (e.g. "VZM") instead of `NAME1_WER` ("HBL VIZIANAGARAM").
- If a row has no `PLANT_SH` yet (synced before SAP added it), fall back to `NAME1_WER` so nothing goes blank.
- Totals and values are unchanged.

## Technical details
- Migration: add nullable `plant_sh text` to `public.purchase_register`, backfill from `raw->>'PLANT_SH'`; mirror in `supabase/migrations`.
- `src/lib/purchase-register-map.ts`: map `PLANT_SH` -> `plant_sh`; add test.
- `src/lib/purchase-register-data.ts`: select `plant_sh`; `plantName = plant_sh || name1_wer`; bump query key.
- Rebuild `middleware/sync-core.mjs`; Quality/Production need the new file copied, PM2 restart, migration run, then a re-sync.
