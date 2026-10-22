# Sales Register: trim filters, 4 per row

## Changes
- Remove the "Sales & Distribution" text under the Sales Register title.
- Remove these Smart Filters: Sales Organization, Salesman, Material Type, Region, Terms of Payment. Reset and the active-filter count no longer count Sales Organization.
- Remaining 13 filters show 4 per row on desktop and tablet-wide screens (including your ~890px window), 2 per row on small tablets, 1 on phones.

Remaining filters, in order: Distribution Channel, Division, Plant, Billing Type, Billing Document Date, Billing Document, Billing Creation Date, Sales Document, Sales Document Item, Customer, Sales Office, Material code, Profit Center.

## Technical details
- `dispatches.tsx`: drop `description` on ReportShell.
- `sales-register-filters.tsx`: delete salesOrg state/input and the four CODE_FIELDS entries; grid `md:grid-cols-4` instead of `min-[900px]:grid-cols-4`.
