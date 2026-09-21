# Fix the Open Sales Orders card so it opens the recreated screen

## Confirmed issue

The recreated Open Sales Orders screen exists at `/reports/sd/open-sales-orders`, but the live **Open Sales Orders** launchpad card still has `/reports/module/sd` saved as its destination. Therefore its bottom **View details** button opens the general Sales module report instead of the screenshot-matched Open Sales Orders screen.

## Correction

- Change the Open Sales Orders card destination to `/reports/sd/open-sales-orders` in the live launchpad data.
- Add the same correction as a database migration so fresh and upgraded installations retain the right destination.
- Add a self-hosted upgrade SQL file for Quality and Production, where launchpad destinations are stored separately.
- Keep **Total Sales** pointing to the Sales Dashboard; only the Open Sales Orders destination changes.
- Keep button-only navigation: clicking the card body does nothing, while its bottom action opens the dedicated report.
- Preserve the recreated report design, filters, charts, table, insights, sample data, authentication, and screen permission check.

## Validation

- Sign in and select the Sales & Distribution module.
- Confirm clicking the Open Sales Orders card body does not navigate.
- Confirm clicking its bottom action opens `/reports/sd/open-sales-orders`.
- Confirm the destination page displays the supplied reference layout rather than the general Sales Dashboard.
- Check desktop and mobile layouts, browser errors, types, and formatting.
