# Order Book: Sales Document Type dropdown uses AUART + VTEXT_DC

## Why it's wrong now
On the Order Book screen, the Sales Document Type description comes from the SECTOR field, not VTEXT_DC.

## Change (Order Book screen only)
- The Smart Filter dropdown will show **AUART — VTEXT_DC**, for example "ZDOR — Domestic Sales", "ZDOR — SEZ Sales" and "ZEOR — Export Sales".
- The Orders by Sales Document Type card, the detailed table, Excel and PDF will use the same VTEXT_DC description.
- If VTEXT_DC is blank, the AUART code is shown on its own.
- Open Sales Orders is unchanged.

## Technical details
- In order-book-data.ts, read `vtext_dc` and map it to the description field the shared document-type helpers use. Keep sector as a separate field so the channel column is unaffected.
- Add a test that a row with AUART ZDOR and VTEXT_DC "Domestic Sales" gives the option label "ZDOR — Domestic Sales".
