# Simplify the Total Sales KPI row

## UI changes

On **Sales & Distribution → Total Sales**, remove these KPI tiles:

- Sales Growth %
- Total Quantity
- Active Customers
- Avg. Revenue / Customer

Hide the **Revenue / AH** tile while keeping its calculation available in the existing analytics logic.

Keep **Total Sales (Amount)** as the only visible KPI tile and adjust the KPI layout so it uses the available width cleanly on desktop and mobile.

## Supporting cleanup

- Remove the retired tile identifiers from the saved drag-and-drop ordering list so old browser preferences cannot restore them.
- Keep the detailed sales data, charts, filters, and calculations unchanged.
- Keep existing drill-down support used elsewhere; only remove the requested tiles from this screen.

## Verification

- Open the Total Sales screen and confirm only **Total Sales (Amount)** appears in the KPI area.
- Confirm none of the five removed/hidden labels appear on this screen.
- Check desktop and mobile sizing, filtering, and the remaining Total Sales drill-down action.
