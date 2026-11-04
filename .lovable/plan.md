# Purchase Orders: Purchase Register card layout + Doc Type badges

Purchase Register stays as it is. Its values use NET_AMT (₹ Cr).

## Purchase Orders screen — new card order (same structure as Purchase Register)
Values use the PO's Net Order Value, counting INR lines only (same rule as today), shown in Cr. Cards keep the current Purchase Orders colored look.

```text
Tiles (unchanged): Total Val | Pending Delivery Val | Pending Invoice Val | POs / Lines
Row 1 (2:1):  Purchase Trend (monthly)        | PO Value by Document Type (donut, click to filter)
Row 2 (1:1):  Top Materials                   | Top Vendors
Row 3 (1:1):  Material Group (donut, click)   | Material Group Summary (table + total)
Row 4 (1:1):  Monthly Expenditure (stacked by Document Type) | Quarterly Comparison (this FY vs last FY, YoY %)
Row 5 (full): Plant Analytics (columns + table: code, name, short name, value, total)
Row 6:        Delivery Aging Status (kept, since you asked for it earlier) beside PO Value by Purchasing Group
Detail table
```

- Cards removed to match Register: Monthly PO Value Trend (replaced by Purchase Trend), PO Value by Created User.
- Material Price Movers and ZRMMAT Comparison are not added, because they belong to Purchase Register only.
- Clicking a Document Type or Material Group slice filters the whole screen, like on Register.

## Detail table — Document Type badge
- The Document Type column shows a colored dot and badge, for example "ZPDM – DOMESTIC".
- Colors come from the group: DOMESTIC, PROJECT, CAPITAL, SERVICE, IMPORTED, OTHERS. They match the donut colors.
- Excel export is unchanged.

## Technical details
- `purchase-orders-data.ts`: add pure helpers for the monthly series by type, quarterly current vs previous FY (April–March), and material-group totals, with tests.
- `purchase-orders-dashboard.tsx`: rearrange the cards, and reuse the shared Card/Donut/BarList/PlantColumns plus a shared group-color map for the donut and the badge.
- No changes to the database or the sync.
