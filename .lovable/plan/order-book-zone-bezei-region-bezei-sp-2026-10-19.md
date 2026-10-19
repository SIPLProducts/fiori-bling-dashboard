# Order Book: Zone = BEZEI, Region = BEZEI_SP

## Current state (checked)
- Orders By Zone already reads **BEZEI**, and Top 10 Regions reads **BEZEI_SP**. This matches your rule.
- A browser that opened the screen before the fix can keep showing the old zones from memory.

## Change
1. Change the Order Book screen's data version so every browser fetches the zones fresh once. People won't need to press Ctrl+F5.
2. Change nothing else. Each user still sees only their assigned Plants and Profit Centres.

## Technical details
- In `open-sales-orders-dashboard.tsx`, change the query key from `["order-book-live","tot-inr-v1"]` to `["order-book-live","tot-inr-zone-bezei-v2"]`.
- Add a test asserting `toOrderBookDashboardRow` maps zone from `BEZEI` and region from `BEZEI_SP`.
- Quality and Production: rebuild the frontend.
