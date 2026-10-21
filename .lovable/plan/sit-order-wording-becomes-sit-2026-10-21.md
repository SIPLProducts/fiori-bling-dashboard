# SIT: "Order" wording becomes "SIT"

Sales In Transit screen and its PDF only. Order Book and Open Sales Orders stay unchanged.

## Tiles
- Total Orders → **SIT Orders**
- Order Value → **SIT Value**
- Total LAH → **SIT LAH**
- Highest Value stays as is.

## Cards, tooltips, legends
Wherever "Order" appears on SIT cards it switches to SIT:
- Orders by Sales Document Type → **SIT by Sales Document Type**
- Orders By Zone → **SIT By Zone**
- Plant-wise order received → **Plant-wise SIT**
- Orders by Main Group / Sub Group → **SIT by Main Group / Sub Group**
- Donut centre "Total Orders" → **SIT Orders**
- Tooltip/legend/axis "Order Value", "Order Count", "Order Value (₹ Cr)" → **SIT Value**, **SIT Count**, **SIT Value (₹ Cr)**
- Detailed table "Order Value (₹ Cr)" column and the matching Excel column → **SIT Value (₹ Cr)**

## Technical details
- The wording context gains a "sit" mode (SIT route provides it); `useOrderWording` returns SIT labels.
- In the dashboard, the tile labels, panel titles and table heading use `isSit` first.
- Excel header follows the same switch if it is hard-coded.
