# Sales Register: trim filters, compact header and cards, PDF

## Header
- Remove the "Sales & Distribution" text under the title.
- Smaller "Sales Register" title and less space around it.
- Right side of the header: **Data available: DD.MM.YYYY – DD.MM.YYYY** (earliest and latest billing date in the data, like Net Sales) and a **PDF** button.
- Until the SAP API is connected, it shows "Data available: —" and the PDF downloads the current (empty) screen, named `Sales Register_DD-MM-YYYY.pdf`.

## Smart Filters
- Remove: Sales Organization, Salesman, Material Type, Region, Terms of Payment.
- Remaining 13 filters show 4 per row (including your ~890px window), 2 on small tablets, 1 on phones: Distribution Channel, Division, Plant, Billing Type, Billing Document Date, Billing Document, Billing Creation Date, Sales Document, Sales Document Item, Customer, Sales Office, Material code, Profit Center.

## Cards
- Shorter tiles (less padding, smaller figure) and chart cards (~150px chart height instead of ~200px), so more fits on one screen. Table unchanged.

## Technical details
- `report-shell.tsx`: optional `actions` and `compact` props (smaller h1, py-2); description optional. Other screens unchanged.
- `dispatches.tsx`: pass compact title, actions = data-range text + PDF button using existing chart-export PDF capture and `datedFileName("Sales Register","pdf")`.
- `sales-register.ts`: add `dateRange` (min/max billingDate) to the aggregate + test.
- `sales-register-filters.tsx`: drop salesOrg and four fields; grid `md:grid-cols-4`.
- `sales-register-dashboard.tsx`: reduce tile padding and chart heights.
