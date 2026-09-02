# Rename profit-centres card title

## Change

Rename the dashboard card title from **"Top 5 Profit Centres by Amount"** to **"Top 5 Profit Centres"** in `src/components/sd-live-dashboard.tsx`.

## Technical note

Only the panel title string changes; the underlying `ProfitCentreBars` component, data source (`analytics.topProfitCentres`), and amount formatting remain unchanged.
