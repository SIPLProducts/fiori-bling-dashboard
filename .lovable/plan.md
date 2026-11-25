# Red bar for near-zero production days

On 01-06 there was production of only ₹7,944 (3 lines), which is 0.00 Cr. It counted as "production", so it got a green bar too thin to see.

Change: any day whose production shows as **0.00 Cr** (under ₹50,000) is treated as "No production". It gets the short red bar, and the legend stays the same. The tooltip still shows the real amount, for example "₹7,944.93 – No production".

Days with 0.01 Cr or more keep their green bars.

## Technical details
- `src/components/daily-production-dashboard.tsx` `DailyChart`: flag `low = value / CR < 0.005`; low days use the red gradient and stub height. Tooltip shows full ₹ for low days.
- Add a test for the threshold through a small pure helper `isNoProductionDay(value)` in `daily-production-data.ts`.
