# Multi-Select Smart Filters

## Changes
- Convert **Customer**, **Sales Zone**, **Sales Type**, **Products**, and **Division** from single-select dropdowns to checkbox multi-select controls.
- Keep **Document Type** as the existing checkbox multi-select, opening with **ZDOR**, **ZEOR**, and **ZSOR** checked.
- Keep the other five filters unrestricted when the screen opens; their dropdowns will show an “All” state until the user checks specific values.
- Allow several values to be checked or unchecked within each dropdown without closing it.
- Apply every selected combination across tiles, charts, rankings, the detailed table, Excel, and PDF.
- Make **Reset** restore unrestricted selections for the five converted filters and the three default Document Types.
- Update the active-filter count so each restricted dropdown counts as one active filter, regardless of how many values it contains.

## Verification
- Confirm all six list filters use checkbox multi-select controls.
- Confirm the initial dashboard includes all customers, zones, sales types, products, and divisions while restricting Document Type to ZDOR, ZEOR, and ZSOR.
- Confirm combined multi-select filters update all report sections and exports.
- Check desktop and mobile layouts, tests, and preview health.

## Technical details
- Store each list filter as a string array.
- Interpret an empty array as unrestricted for Customer, Sales Zone, Sales Type, Products, and Division.
- Continue interpreting an empty Document Type array as no matching rows, preserving explicit document-type selection behavior.
- Reuse the shared checkbox `MultiSelect` control for consistent interaction and styling.
