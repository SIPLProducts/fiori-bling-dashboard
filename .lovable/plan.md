# Daily Production Report: plant code + short name

## What changes
1. **Plant filter**: each option shows "code — short name" (e.g. "1010 — HYD"), sorted by code. Plants without a short name show just the code.
2. **Production Details table**: the current "Plant" column becomes "Plant" (code), and a new **"Plant Short Name"** column is added right after it. Same in the Excel download. Search keeps matching both.

Cards, tiles and charts stay unchanged.

## Technical
- `src/components/daily-production-dashboard.tsx`: plant option label `${code} — ${shortName}`; HEADS insert "Plant Short Name" after "Plant"; cells use `r.plant`, then the short name (raw `plant_short_name`, blank when missing).
- Expose a `plantShort` field in `toDprRow` (daily-production-data.ts) without the code fallback.
