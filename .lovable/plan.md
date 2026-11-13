# Month Wise Stock: values in ₹ Cr, Top 10 Types + Others

## What changes
1. **All values in ₹ Cr** on tiles, charts and cards of Month Wise Stock (e.g. 6,83,48,498 → 6.83). Card subtitles say "₹ Cr". The detailed table and Excel keep full values.
2. **Top Types card**: shows the top 10 types by value; if there are more, an 11th bar **"Others"** holds the sum of the rest.
3. **Click "Others"**: a small popup lists each remaining type with its ₹ Cr value (sorted highest first), with a Close button.

## Technical details
- In month-wise-stock-dashboard.tsx add `cr = v => (v/1e7).toLocaleString("en-IN",{min/max 2})`; use it as `fmt` for tiles, BarList cards, Plants/Materials/Month charts (labels, axis, tooltip).
- Pure helper `topWithOthers(list, 10)` in month-wise-stock-map.ts returning `{ top, others }`; add a test.
- Others bar is a clickable row opening a Dialog (shadcn) listing `others`. PDF shows top 10 + Others row.
