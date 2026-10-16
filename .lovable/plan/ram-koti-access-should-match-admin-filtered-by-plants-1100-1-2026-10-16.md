# Ram Koti access should match Admin filtered by plants 1100 + 1200

## Why it doesn't match today
Ram Koti has plants 1100 and 1200, and also **all 157 profit centres** ticked. The rule is "plant OR profit centre". Every record has a profit centre in that list, so he sees all 111 Open Order lines. Admin filtered to 1100 + 1200 sees 29.

## Changes
1. **All profit centres ticked counts as "no profit centre limit".** If every profit centre is ticked, only the plants restrict the data. The same works the other way round: all plants ticked means only the profit centres restrict. Ram Koti then sees exactly the 29 lines for 1100 + 1200.
2. **User form:** when every profit centre (or plant) is ticked, it's saved as "All" (an empty list), and the hint says so. Ram Koti's record is corrected to plants 1100, 1200 with profit centres = All.
3. **Sales Dashboard (Net Sales):** add a **Profit Centre** dropdown to Smart Filters, shown as "PRCTR — LTEXT" (code — description). Both are already stored for every Net Sales row. It lists only the profit centres in the user's own data, or all of them for admins and unrestricted users. It filters the cards, charts, tables, Excel and PDF the same way Plant does.
3a. **Top 10 Profit Centres** chart labels also use "PRCTR — LTEXT", falling back to the code alone when the description is empty.
4. Smart Filter Plant lists on all screens keep showing only the user's assigned plants.

## Technical
- `admin.functions.ts`: normalise arrays. If the selection equals the full master list for that category, save `{}`.
- One-time data fix for existing profiles whose list equals the full master list: clear it, which covers Ram Koti.
- `sd-live-dashboard.tsx` / `sd-live.ts`: add `profitCenters` to the filter state, options from the loaded rows (`profit_ctr` + `profit_ctr_name`), and apply it in the shared pure filter helper.
- Tests: full-list normalisation to `{}`, and that the profit centre filter narrows the totals.
- Update `deploy/user-access/` with the data fix for Quality and Production.
