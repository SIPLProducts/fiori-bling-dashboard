# Inventory Aging: Profit Centre description (PRCTR_DESC)

SAP now returns PRCTR_DESC (e.g. PGNLB11001 → "NCPP-Shameerpet (M)").

## What changes
- **Profit Centre dropdown:** shows "code — description", e.g. "PGNLB11001 — NCPP-Shameerpet (M)".
- **Profit Centre Wise Ageing chart:** bars labelled with the description (code shown in tooltip; falls back to code if no description).
- **Table and Excel:** "Profit Centre" (code) plus a separate "Profit Centre Desc" column next to it.
- Existing rows show a blank description until the next sync.

## Technical details
- Migration (mirrored in supabase/migrations): add `prctr_desc text` to public.so_ageing.
- so-ageing-map.ts: map PRCTR_DESC → prctr_desc.
- so-ageing-data.ts: add to COLS, AgeRow `pcDesc`; group PC chart by code with description label.
- so-ageing-dashboard.tsx: dropdown labels, chart labels, table/Excel columns.
- Rebuild middleware sync-core.mjs; self-hosted: run migration, copy sync-core.mjs, pm2 restart MIS_QTY.
