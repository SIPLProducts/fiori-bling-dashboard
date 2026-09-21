# Align Open Sales Orders with the Sales Dashboard shell and filters

## Changes

- Restore the shared authenticated portal top bar on the Open Sales Orders page, matching the Sales Dashboard and other report pages.
- Keep the page title and description in the report content, but remove the separate Search field, notification icon, and user icon currently shown to the right of the Open Sales Orders heading.
- Consolidate Date Range, Sales Organization, Distribution Channel, Sales Office, Customer, and Sales Group into one bordered filter card, following the Sales Dashboard's Smart Filters presentation.
- Give the filter card a compact heading, expandable/collapsible controls, reset action, and responsive grid while preserving all current filter values and filtering behavior.
- Keep every KPI, chart, table, insight panel, sample dataset, permission check, and launchpad destination unchanged.

## Responsive behavior

- On desktop, show the filter controls together inside one compact card.
- On tablet and mobile, stack the controls cleanly within the same card without horizontal overflow.

## Validation

- Confirm the shared portal top bar appears.
- Confirm the duplicate right-side Search, notification, and user controls are gone from the page heading.
- Verify all six filters still update the entire dashboard and Reset restores all data.
- Check desktop and mobile layouts, browser errors, and type validation.
