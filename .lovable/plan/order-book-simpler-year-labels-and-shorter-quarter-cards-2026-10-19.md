# Order Book: simpler year labels and shorter Quarter cards

## What changes
- **Financial Year dropdown** shows plain years: **2026, 2027 …** instead of "FY 2026–27". The year shown is the year the April–March period starts (2026 = 1 Apr 2026 to 31 Mar 2027). Newest first; filtering stays the same.
- **Quarter cards** become shorter on the Order Book screen: smaller monthly chart (about 96px instead of 160px), tighter spacing, smaller value labels. The PDF uses the same shorter cards.
- Net Sales quarter cards stay unchanged.

## Technical details
- `yearOptions` label in `open-sales-orders-dashboard.tsx` becomes `year`.
- Add an optional `compact` prop to the shared `QuarterCard` (`sd-live-dashboard.tsx`): chart `h-24`, reduced margins/padding, axis labels hidden; Order Book passes `compact`.
