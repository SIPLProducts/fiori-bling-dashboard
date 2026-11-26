# Daily Production Report: plant code + short name

## What changes
1. **Plant filter**: each option shows "code — short name" (e.g. "1010 — HYD"), sorted by code. Plants without a short name show just the code.
2. **Production Details table**: the current "Plant" column becomes "Plant" (code), and a new **"Plant Short Name"** column is added right after it. Same in the Excel download. Search keeps matching both.

Cards, tiles and charts stay unchanged.

## Technical
- `src/components/daily-production-dashboard.tsx`: plant option label `${code} — ${shortName}`; HEADS insert "Plant Short Name" after "Plant"; cells use `r.plant`, then the short name (raw `plant_short_name`, blank when missing).
- Expose a `plantShort` field in `toDprRow` (daily-production-data.ts) without the code fallback.

## Other screens (detailed tables + Excel)
Add a **Plant Short Name** column right after the plant code column wherever a detailed table shows a plant: Dispatches, Open Sales Orders / Order Book / SIT, Net Sales, Purchase Register, Purchase Orders List, Open Purchase Orders, Current Stock, Month Wise Stock, SO Ageing, Cash Flow.
- Short name comes from the SAP field when the screen has one (e.g. PLANT_NAME on SO Ageing); otherwise from the shared plant master already used by filters. Blank when unknown.
- Plant column itself shows the code only. Admin screens (Users, SAP API Settings) are not changed.
