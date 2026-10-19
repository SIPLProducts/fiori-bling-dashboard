# Order Book: card rows and "Order" wording

Applies to the Order Book Report screen and its PDF only. Open Sales Orders keeps its current layout and wording.

## Layout
```text
Row 1: [Month on Month] [Sales Document Type] [LD]
Row 2: [Orders by Main Group] [Orders by Sub Group]
Row 3: [Orders By Zone] / [Plant-wise order received]   (as today)
... rankings, table (unchanged)
```
- LD moves back up, next to Sales Document Type.
- Main Group and Sub Group get their own row, side by side.

## Renames
- Open Orders by Main Group → **Orders by Main Group**
- Open Orders by Sub Group → **Orders by Sub Group**
- In every Order Book card, tooltip, chart legend and axis label:
  - "Open Value" → **Order Value**
  - "Open Orders" / "Orders" counts → **Order Count**
  - This covers the group, zone, plant, LD and ranking tooltips, the "Open Value (₹ Cr)" chart labels, and the detailed table/Excel value heading.

## Technical details
- In the dashboard, when `isBook` is true, the overview row has 3 cards (`lg:grid-cols-3`: MoM, Doc Type, LD). The group row comes back for Order Book with the new titles. LD is removed from the zone/plant column.
- Pass a `variant`/`isBook` prop (or label props) to the shared chart and tooltip components: OpenOrdersGroupChart, PlantPendingChart, OpenOrdersLdStatusChart, RankingTooltip, SalesZoneTooltip, and the compact zone chart. That lets them swap their labels without changing Open Sales Orders.
- If the shared export helper hard-codes the Excel column header, switch it on the variant.
