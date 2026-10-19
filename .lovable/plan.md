# Order Book: clear saved data and apply user Plant + Profit Centre access

## 1. Clear the Order Book data
- Remove all 3,364 saved lines from the `order_book` table (only the data rows). The table, its columns and the Order_Book API settings stay.
- After that, click Fetch / Sync on Order_Book in SAP API Settings to load it again.

## 2. User access on the Order Book screen (same as Cash Flow, which has both fields)
- **Smart Filters:** add a **Profit Centre** dropdown next to Plant. Both dropdowns list only the Plants / Profit Centres assigned to the logged-in user.
- **Data:** with filters on "All", the screen shows only lines matching the user's assigned Plants **and** assigned Profit Centres. If a user has only Plants assigned, only Plants are checked (and the same for Profit Centres only).
- Picking values in both dropdowns narrows to lines that match both.
- Admins and users with no assignments see everything.
- Cards, quarter cards, charts, table, Excel, PDF and the Order Book launchpad tile all use this same set of lines.
- Open Sales Orders keeps its Plant-only behaviour.

## Technical details
- Data delete via a data-change SQL on `public.order_book` (no schema change).
- In `open-sales-orders-dashboard.tsx` (`isBook` branch): `scopeRowsToAssigned(..., { plant, profitCentre })`; add a `profitCentres` filter option list via `restrictToAssigned` and apply it in the book filter step. Launchpad tile uses the same scoping.
