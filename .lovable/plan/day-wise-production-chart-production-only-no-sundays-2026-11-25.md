# Day Wise Production chart: production only, no Sundays

Changes to the **Day Wise Production vs Scrap** card (renamed **Day Wise Production**):

- Shows only production value; scrap bars are removed.
- Sundays are left out entirely.
- Every other day in the shown period appears, including days with no production:
  - Days with a production value: **green** radiant bar.
  - Days with no production: a short **red** radiant bar so the day is still visible (tooltip says "No production").
- A small legend under the chart: green = Production, red = No production.
- The same colours and legend appear in the PDF.

## Technical details
- `src/lib/daily-production-data.ts`: new pure `dprDailyChart(rows)` builds every date from first to last posting date in the filtered rows, skips Sundays, and flags zero days.
- `src/components/daily-production-dashboard.tsx`: `DailyChart` uses one Bar with per-day `Cell` gradient fills (green/red), a fixed small stub height for zero days, and a legend row.
- Tests: Sundays excluded, missing weekdays filled as zero, values summed per day.
