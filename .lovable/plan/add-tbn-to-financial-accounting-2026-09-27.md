# Add TBN to Financial Accounting

## Change
- Add a **TBN** tile under Financial Accounting, available to the same roles as the existing finance screens.
- Link the tile to a dedicated TBN report sourced directly from the ZTBN table.
- Show all ZTBN business columns in workbook order, with horizontal scrolling, search, and pagination so the wide data remains usable.
- Keep the ZTBN Tables Master configuration and existing imported data unchanged.

## Technical details
- Add the finance screen permission and tile through a database migration, including grants through existing role-screen assignments.
- Add an authenticated client data reader that respects the existing ZTBN read policy.
- Add a protected report route with unique page metadata, loading/error/empty states, and compact number formatting.

## Verification
- Confirm the Financial Accounting tab shows TBN and opens the report.
- Confirm the report reads live ZTBN rows and exposes all mapped columns without page overflow.
