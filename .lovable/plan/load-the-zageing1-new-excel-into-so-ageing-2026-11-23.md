# Load the ZAGEING1_NEW Excel into SO Ageing

## What you will see
- The 19 lines in the Excel's "Data" sheet go into the SO Ageing table. The SO Ageing screen and its launchpad tile then show them right away: tiles, bucket donut, plant, storage location and profit centre cards, the details table and Excel.
- Key date: 23-11-2026. Buckets: 0–90, 91–180, 181–365 and >365 days, the same as the Excel headings.
- The next successful SAP sync replaces these lines with live data, as already set up.

## Column mapping (Excel to SO Ageing)
Plant→WERKS, Storage Location→LGORT, SLoc Name→SNAME, Material Code→MATNR, Material Description→MAKTX, UOM→MEINS, Qty/Value 0–90→BUCK1/VALU1, Qty/Value 91–180→BUCK2/VALU2, Qty/Value 181–365→BUCK3/VALU3, Qty/Value >365→BUCK4/VALU4, Quantity→CL_STCK, Value→PRICE, Late Mat Doc No→MBLNR, Reference Year→MJAHR, Date→BLDAT, Batch No.→CHARG, Mat.Prof.Cent.→PRCTR, Plant Short Name→PLANT_NAME.

## Technical details
- This is a one-time data load into the existing table (stored in the database as `so_ageing`; the screen title stays "SO Ageing"). The table's structure doesn't change.
- Each Excel row is mapped with the same SAP mapper, so leading-zero and number handling match what sync does. The raw row is kept. Rows are upserted on the existing line key.
- Afterwards, check the row count and totals against the Excel sums, and look at the screen with a signed-in browser.
