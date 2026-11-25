# Day Wise Production: clear red bars for no-production days

On 01-06 production was only ₹7,944 (3 lines), which is 0.00 Cr. It showed as a green bar too thin to see.

Changes:
- Any day showing **0.00 Cr** (under ₹50,000), or with no entries at all, counts as **No production**.
- No-production days get a **full-height red radiant bar**, as tall as the tallest day, so they stand out.
- All bars become **narrower** (about 18 px wide), leaving more space between days.
- The tooltip still shows the real amount: "₹7,944.93 – No production".
- The legend stays: green = Production, red = No production. Same in the PDF.

## Technical details
- `daily-production-data.ts`: pure `isNoProductionDay(value)` (value / 1e7 < 0.005); test it.
- `daily-production-dashboard.tsx` `DailyChart`: bar height = chart max for no-production days, red gradient, `maxBarSize={18}`; tooltip shows full ₹ for those days.
