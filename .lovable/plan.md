# Order Book Report — copy of the Open Sales Orders design

## Result
- The Order Book tile opens **Order Book Report** (replacing "Coming soon"), with the same look, layout, Smart Filters, summary tiles, charts, detailed table, Excel/PDF export and Refresh as the Open Sales Orders screen.
- Data comes from the Order Book table synced from SAP (ZORDERBOOK), filtered by the user's assigned Plants like Open Sales Orders.

## Removed on Order Book only
- Open Orders by Aging Bucket
- Open Order Value Trend
- Open Orders (Not Delivered) status card
- Partial Delivered Orders status card
- Longest Aging in Quick View (Highest Value and Highest Quantity remain)

Open Sales Orders stays unchanged.

## Kept cards (fed from Order Book fields)
- Summary tiles: total orders (distinct order numbers), order value, Total AH in LAH
- Document Type, Sales Zone, LD Status, Plant-wise Pending, Main Group, Sub Group, Top 10 Customer / Product, Model Wise
- Detailed table with search, status filter, pagination, Excel and PDF

## Field mapping
- Order no./item: VBELN/POSNR; Created date: ERDAT; Customer: NAME1_SP; Product: MAKTX; Plant: WERKS/PLANT_NAME; Doc type: AUART/VTEXT_DC; Division: DIV_NAME; Main/Sub group: MAIN_GRP/SUB_GRP; Profit Centre: PC_CODE/PC_NAME; Quantity: KWMENG; Value: TOT_INR; AH: TOT_AH.
- Cards with no matching Order Book field show an empty state rather than invented values.

## Technical details
- Reuse the dashboard by adding a variant/config prop that hides the removed cards and switches data source, titles and PDF/Excel names to Order Book; avoid duplicating the 50k-character component.
- New stable query reading all `order_book` rows (paginated), explicit Refresh only.
- Route `/reports/sd/order-book` keeps its permission key `sd.order-book`.
- Verify with tests for the mapping helper and a preview check; Quality/Production need a frontend rebuild.
