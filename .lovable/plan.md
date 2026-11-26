# Daily Production launchpad tile: latest month, four figures

The launchpad tile will show the same month the screen opens on (the latest month with data, e.g. June 2026), with the month name shown on the tile. Figures, in this order:

1. **No of Prod Order** — each Prod. Order number counted once.
2. **Prod Val (₹ Cr)** — total of Value.
3. **Scrap Val (₹ Cr)** — total of Scrap Val.
4. **Net Prod Val (₹ Cr)** — Prod Val minus Scrap Val.

Last sync line stays. "Total Count" is removed. Figures match the screen tiles when it opens.

## Technical details
- Use `defaultDprDates` (daily-production-filters) to pick the latest month, and the same tile helper as the screen for distinct `aufnr`, value, scrap and net.
- `launchpad.tsx` `DailyProductionTile`: big value = No of Prod Order, note shows month label (e.g. "Jun 2026"), list rows Prod Val, Scrap Val, Net Prod Val.
- Add/update a test asserting the tile summary uses only the latest month and counts distinct orders.
