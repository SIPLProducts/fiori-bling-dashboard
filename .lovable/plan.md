# Daily Production Report – Year/Month filters

## What changes
- Add **Year** and **Month** dropdowns to the filter bar (next to Plant). Years/months listed from the loaded data.
- Posting Date From / To start **empty** (not pre-filled with the financial year).
- On opening the screen, Year and Month are pre-selected to the **latest month that has data** (current month if it has data), so tiles, cards and table show that month.
- If the user picks Posting Date From/To, those dates apply on top of Year/Month; choosing "All" in Year/Month removes that restriction.
- Reset returns to the latest month with dates empty.
- Excel/PDF follow the filtered data as now.

## Technical
- src/components/daily-production-dashboard.tsx: replace `fy.from/fy.to` defaults with `""`; add `year`/`month` state initialised from max `r.date` in rows (useEffect once rows load); filter by `r.date.slice(0,4)` / `slice(5,7)`.
