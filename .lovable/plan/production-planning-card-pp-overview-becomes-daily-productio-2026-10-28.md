# Production Planning card: "PP Overview" becomes "Daily Production Report"

## What changes
- The **PP Overview** card in the Production Planning section on the launchpad is renamed **Daily Production Report**.
- Its note reads "Daily production output" and the button reads **Open Details**, like the other cards.
- Clicking it opens the Daily Production Report screen (the "coming soon" page for now) instead of the old overview page.
- The card only shows for users who have the Daily Production Report permission.
- The section heading "Production Planning" stays the same.

## Technical details
- `src/routes/_authenticated/launchpad.tsx`: the generic-section branch hard-codes a `TableStatusTile` titled "PP Overview" linking to `/reports/module/pp`. Production Planning gets its own branch that renders the `launch` tile for `pp.daily-production-report` (title from `public.tiles`, already "Daily Production Report") with href `/reports/pp/daily-production-report`. The hard-coded overview card is removed for Production Planning.
- No database change is needed: the tile row is already titled "Daily Production Report".
