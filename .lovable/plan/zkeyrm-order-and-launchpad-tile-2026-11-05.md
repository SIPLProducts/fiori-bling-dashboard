# ZKEYRM order and launchpad tile

## Changes
1. **Purchase Register screen order**: show the ZKEYRM Comparison card first, then Material Price Movers right after it (currently the reverse).
2. **Launchpad tile**: rename the "ZRMMAT" tile to **ZKEYRM** and show the number of materials uploaded (e.g. "124 materials") on the tile.
3. Rename the ZRMMAT master screen title, upload dialog and empty messages to ZKEYRM for consistency. Stored data, page address and permissions stay unchanged, so existing uploads and user access keep working.

## Technical details
- `purchase-register-dashboard.tsx`: swap `<MaterialTrendSection>` and `<ZrmmatCompareCard>`.
- `screens.ts`: label "ZKEYRM" (key `tables.zrmmat` / tileKey kept).
- Add a small launch card for `table_zrmmat` that counts distinct material codes in the ZRMMAT master category (same source the comparison card uses), wired into the launchpad tile renderer like other launch cards.
- Update visible strings in `routes/_authenticated/reports/tables/zrmmat.tsx` and `zrmmat-compare-card.tsx` ("All ZKEYRM materials").
