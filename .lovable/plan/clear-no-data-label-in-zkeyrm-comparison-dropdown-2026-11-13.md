# Clear "no data" label in ZKEYRM Comparison dropdown

## What changes
- Month Wise Stock: materials with no rows show **"(no stock in selected months)"** instead of "(no purchase)".
- Purchase Register and Purchase Orders List: show **"(no purchase in selected period)"**.
- Each such item gets a hover tooltip: "In ZKEYRM master, but no records found for the current filters."
- A short note under the dropdown heading: "All materials listed are from the ZKEYRM master table."

## Technical details
- `ZrmmatCompareCard` gets an optional `emptyLabel` prop (default "no purchase in selected period"); Month Wise Stock passes "no stock in selected months".
- Tooltip via `title` attribute on the item span.
