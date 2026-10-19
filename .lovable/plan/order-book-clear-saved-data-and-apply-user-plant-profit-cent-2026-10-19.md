# Order Book: clear saved data and apply user Plant + Profit Centre access

## 1. Clear the Order Book data
- Remove all 3,364 saved lines from the `order_book` table (only the data rows). The table, its columns and the Order_Book API settings stay.
- After that, click Fetch / Sync on Order_Book in SAP API Settings to load it again.

## 2. User access on the Order Book screen
- **No Profit Centre dropdown** is added; Smart Filters keep the Plant dropdown, listing only the user's assigned Plants.
- **Lines shown, based on the user's assignments:**
  - Plants and Profit Centres both assigned: lines matching an assigned Plant **and** an assigned Profit Centre.
  - Only Plants assigned: lines matching those Plants.
  - Only Profit Centres assigned: lines matching those Profit Centres.
  - Admins or no assignments: everything.
- Cards, quarter cards, charts, table, Excel, PDF and the Order Book launchpad tile all use this same set of lines.
- Open Sales Orders is unchanged.

## Technical details
- Data delete via a data-change SQL on `public.order_book` (no schema change).
- In `open-sales-orders-dashboard.tsx` (`isBook` branch) and the Order Book launch card: `scopeRowsToAssigned(rows, access, { plant, profitCentre })`.
