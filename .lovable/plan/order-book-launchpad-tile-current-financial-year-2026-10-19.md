# Order Book launchpad tile: current financial year

## Change
- The Order Book tile will total only orders whose **Created Date** falls from 1 April of the current financial year up to today (India date). On 19 Oct 2026 that is 01.04.2026 – 19.10.2026.
- Add a small caption such as **FY 2026–27 · 01.04.2026 – 19.10.2026**.
- The total value, the order-line count and the document-type bars all use this same period, and it changes automatically on 1 April.
- It still follows each user's Plant/Profit Centre access and refreshes only when you click Refresh/Sync.
- The Open Sales Orders tile and the Order Book report screen stay the same.

## Technical details
- In `OrderBookLaunchCard`, select `created_date` too and filter rows with the shared April–March range helper (`report-period.ts`) before `summarizeLaunchOrders`.
- Bump query key so old cached all-dates totals are not reused.
- Add a test: a row dated March 2026 is excluded and a row dated April 2026 is included for 19 Oct 2026.
