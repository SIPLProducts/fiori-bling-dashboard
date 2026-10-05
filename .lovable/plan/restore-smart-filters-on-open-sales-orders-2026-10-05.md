# Restore Smart Filters on Open Sales Orders

## Changes

- Restore the full **Smart Filters** card above the four summary cards while keeping the new three-row dashboard design unchanged.
- Include the original six controls: Date Range, Sales Organization, Distribution Channel, Sales Office, Customer, and Sales Group.
- Make every summary value, aging bucket, value chart, sales-zone chart, delivery-status card, and Quick View result respond to the filtered records.
- Add the compact card heading, expand/collapse control, active-filter count, and Reset action used by the earlier Open Sales Orders screen.
- Populate each selector from the available Open Sales Orders data and preserve the current sample dataset and route permissions.

## Responsive behavior

- Keep all controls in one bordered card, arranged in a compact desktop grid and stacked cleanly on smaller screens.
- Preserve the existing dashboard reading order and prevent horizontal overflow.

## Validation

- Verify all six filters individually and in combination.
- Confirm Reset restores the complete dataset and all original dashboard totals.
- Check expand/collapse behavior, desktop and mobile layouts, browser errors, focused tests, and the preview build.
