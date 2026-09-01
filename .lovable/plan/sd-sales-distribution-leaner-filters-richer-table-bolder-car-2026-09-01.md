# SD — Sales & Distribution: leaner filters, richer table, bolder cards

## 1. Smart filters (as marked on your screenshot)

Remove: Fiscal year, Sales type, Segment, Product group, Country.

Keep: Posting from / Posting to with the Last 7 / 30 / 90 day presets, Plant, Profit centre, and the search box + Reset. Active-filter chips follow the same reduced set, so the bar becomes a single tidy row.

## 2. Report table matched to your ZFISALES extract

The uploaded workbook (32,543 rows, 59 columns) carries columns the synced table does not keep yet. Add these as nullable columns on `zfisales_detail` and map them during sync, so the report can show the full line:

PC short name, Sub group, New/Repl, Division name, Industry name, Document item, Material profit centre + name, AH (per line), Sales zone, Customer profile.

Drill-down table columns (in this order), with sticky header, zebra rows, right-aligned figures, negative amounts in red, search and CSV export of exactly what is on screen:

Document No · Item · Posting date · Month · Profit centre (code + name) · Customer · Sales type · Main group / Sub group · Material · Material description · Model / Range / Type · UOM · Qty · Total AH · Amount · Segment · Sales employee · Incoterms · Usage

Column-visibility toggle so a user can hide the columns they don't need, and pagination for large result sets.

## 3. Aesthetic pass — distinct card colours

KPI cards get their own tinted surface instead of the current uniform white with a thin top bar: soft tinted background, matching icon chip, coloured value, subtle hover lift. One colour per KPI:

- Total revenue — indigo (with Domestic / Export / Service split bars)
- Documents — teal
- Customers — amber
- Avg per document — violet
- Quantity — emerald
- Top profit centre — rose

Charts keep the existing set but get consistent per-series colours from the same palette, rounded bar caps, softer gridlines, and clearer empty states. Panels get a light header rule and slightly stronger shadow so the page reads as grouped sections rather than one flat grid.

## Technical notes

- Migration: nullable columns added to `public.zfisales_detail`; grants and RLS unchanged, no data touched.
- `src/lib/zfisales-sync.server.ts`: extend `mapRow` with the new SAP field mappings (PC short name, sub group, New_Repl, division/industry text, document item, material profit centre, AH, sales zone, customer profile).
- `src/lib/sd-live.ts`: drop the removed filter keys from `SdFilters` / `applySdFilters`, widen `SdLine` and the select list with the new columns.
- `src/components/sd-live-dashboard.tsx`: filter bar rewrite, new tinted `KpiCard` variants, extended table with column toggle + pagination, CSV export updated.
- New colour tokens added to `src/styles.css` as semantic KPI tones (oklch) — no hardcoded colour utilities in components.
