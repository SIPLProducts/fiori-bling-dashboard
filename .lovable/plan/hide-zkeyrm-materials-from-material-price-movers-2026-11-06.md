# Hide ZKEYRM materials from Material Price Movers

## Change
Material Price Movers (Rising / Falling) on the Purchase Register screen will leave out every material that is in the uploaded ZKEYRM list. Only the remaining materials are ranked, so the top lists fill up with the other materials. When the ZKEYRM list changes (upload, edit, delete), the movers update to match.

ZKEYRM Comparison stays as it is.

## Technical details
- `material-trend-card.tsx`: read the same ZKEYRM rows query (`zrmmatRowsQuery`), build a set of material codes with `zrmmatMaterials` + `normMat` (leading zeros ignored), and filter rows with `!zkeyrm.has(normMat(r.material))` before `materialTrends`, alongside the existing `isPriceMoverMaterial` filter.
- Add a test for the exclusion helper in the existing price-movers tests.
