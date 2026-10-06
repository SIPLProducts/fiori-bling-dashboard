# Open Sales Orders rankings and filters

## Ranking cards
- Place **Top 10 Open Orders by Customer**, **Top 10 Open Orders by Product**, and **Open Orders by Model Wise** in one desktop row, in that order.
- Use a 12-column grid with **4 + 4 + 4** equal-width cards, matching the upper chart row.
- Preserve single-line description labels, rankings, tooltips, and PDF output. Stack cards on smaller screens.

## Smart Filters
- Remove **Sales Type** from the Open Sales Orders filters and remove its filtering condition and active-filter count contribution.
- Keep Date Range, Customer, Sales Zone, Products, Division, and Document Type, with a balanced six-control desktop layout.
- Show **code — description** wherever the stored data provides both. Customer uses sold-to code and name; Products uses material code and description.
- Filter customers by code rather than name so customers sharing a name remain distinct.
- For Sales Zone, Division, and Document Type, use available source descriptions only. Where a matching code or description is unavailable, display the available value without inventing one; identify any missing descriptions after implementation.
- Keep dropdown search working for codes and descriptions.

## Bulk selection
- Add visible **Select All** and **Deselect All** actions to each of this screen’s checkbox dropdowns, including Document Type. Date Range remains a calendar.
- Select All checks every available option, regardless of the search text. Deselect All unchecks every option and shows no matching orders until values are selected again.
- Preserve the opening/reset defaults: Customer, Sales Zone, Products, and Division include all available values; Document Type checks only **ZDOR, ZEOR, ZSOR**.

## Technical details and validation
- Keep changes scoped to Open Sales Orders; shared dropdown enhancements must not change other screens’ selection behavior.
- Use existing stored fields for labels; no SAP sync or database changes are included.
- Verify equal-width cards, code/name search, duplicate customer names, bulk actions, empty selections, combined filters, Reset, smaller-screen overflow, and PDF rendering.
