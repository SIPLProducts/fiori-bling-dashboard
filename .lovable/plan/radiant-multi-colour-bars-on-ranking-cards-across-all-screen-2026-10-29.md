# Radiant multi-colour bars on ranking cards across all screens

## What you will see
The ranking cards (Profit Center, Material, Industry Name, Segment, Customers, Sales Men, Model, Type and similar "Top 10" lists) will all use the same look as your screenshot: each row gets its own colour (blue, teal, green, orange, purple, red, ...) as a rounded bar that fades from soft to strong, with the value in bold on the right. Today Net Sales and some other screens show these bars in one flat colour.

Screens covered: Net Sales, Open Sales Orders, Sales In Transit, Order Book, Sales Register, Purchase Register, and the matching home screen cards. Works in Light, Dark and Glassy.

Not changed: numbers, sorting, filters, click-to-filter, totals, and PDF/Excel content (PDF bars will show the same colours as the screen).

## Technical details
- Add one shared palette + helper in `src/lib/radiant.ts`: `radiantColor(i)` and `radiantBar(i)` returning `linear-gradient(90deg, color-mix(in oklab, c 60%, transparent), c)` built from existing chart/kpi tokens so themes stay consistent.
- `sd-live-dashboard.tsx` `BarList`: replace single `KPI_TONES[tone]` fill with per-row `radiantBar(index)`, rounded-full pill, bold value. Used by Profit Centres, Materials, Sales Men, Industry Name.
- Apply the same helper to horizontal ranking bars in `open-sales-orders-dashboard.tsx` (and the SIT / Order Book screens that reuse it), Recharts vertical-layout bar cards via per-row `<Cell>` gradient fills, plus `sales-register-dashboard.tsx` and `purchase-register-dashboard.tsx` RankList (switch to the shared helper).
- Segment / Model / Type donut and column cards get per-slice radiant gradients from the same palette.
- Keep existing LD Status green/red and Quick View colours unchanged (saved rules).
