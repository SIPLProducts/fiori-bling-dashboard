# SIT tiles: whole-number round-off decided from 3 decimals

## Change (SIT screen only)
- The **SIT Value**, **Highest Value** and **SIT LAH** tiles show a whole number.
- The value is first taken to 3 decimals and then rounded once. It is no longer cut to 2 decimals before rounding, which could push it the wrong way.
  - 24.499 → **24**
  - 24.500 → **25**
  - 24.495 → **24** (before this change it became 24.50 and then 25)
- SIT Value and Highest Value show as ₹24 Cr; SIT LAH shows as 24 LAH.
- Totals are still added up from the full SAP values (NETWR_TOT, TOT_AH).
- Order Book, Open Sales Orders and the other SIT cards, the table and the exports stay unchanged.

## Technical details
- Add `roundWhole3(value)` in `src/lib/format.ts`: `Math.round(Number(value.toFixed(3)))`. This replaces the 3-decimal `formatSit3` on the three SIT tiles in `open-sales-orders-dashboard.tsx`.
- Update `tests/sit-three-decimals.test.ts` with the cases 24.499 → 24, 24.500 → 25 and 24.495 → 24.
