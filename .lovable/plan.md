# Daily Production launchpad tile: No of Prod Order, Prod Val, Scrap Val

The launchpad tile will show the same three figures as the screen tiles, for the current financial year (April to today), as now:

- **Prod Val (₹ Cr)** — main big figure (total of Value).
- **No of Prod Order** — each Prod. Order number counted once.
- **Scrap Val (₹ Cr)** — total of Scrap Val.
- Last sync line stays. "Total Count" (line count) is removed.

## Technical details
- `src/lib/daily-production-data.ts`: `dprPeriodSummary` adds `orders` = distinct non-empty `aufnr` in range (reuse the screen tile helper if present).
- `src/routes/_authenticated/launchpad.tsx` `DailyProductionTile`: note "Prod Val (₹ Cr)", list rows "No of Prod Order" and "Scrap Val (₹ Cr)".
- Update `daily-production-period.test.ts` to assert distinct order count.
