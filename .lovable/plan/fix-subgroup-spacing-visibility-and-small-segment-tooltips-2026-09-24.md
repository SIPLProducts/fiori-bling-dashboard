# Fix subgroup spacing, visibility, and small-segment tooltips

## Goal
Make every Sub Group visible in the drilled Main Group view, use the available chart width efficiently, and ensure even very small PC Short Name segments have a reliable tooltip.

## Changes
- Keep the default Main Group view and click-to-drill behavior unchanged.
- In the drilled view, render the complete live `subGroupsByMainGroup` list in descending amount order; do not cap, combine, or replace Sub Groups with “Others.”
- Reduce the fixed space allocated per Sub Group and remove the excessive category gap so BATTERY, DEFENCE ELECT…, PE, LIB-ESS, TPS, INDUSTRIAL BA…, SMS, PEU, OTHERS, and all additional Sub Groups fit more tightly.
- Size the plot from the actual number of Sub Groups and available panel width. Use horizontal scrolling only when the full list cannot remain readable.
- Keep each Sub Group stacked by every real PC Short Name division, without division aggregation.
- Replace the current tiny-segment hover dependency with an enlarged invisible interaction target for each rendered stack segment. The visible segment dimensions remain accurate, but small top segments become easy to hover.
- Show one focused tooltip only for the exact segment under the pointer: Sub Group, PC Short Name, amount, record count, and percentage of that Sub Group.
- Keep total labels, full division legend, selected Main Group label, back action, current filters, live values, and the 4-column/8-column card layout.

## Verification
- Drill into INDL.BATTERY and confirm every returned Sub Group is present and sorted descending.
- Verify tighter spacing uses the full card width before horizontal scrolling appears.
- Hover each small segment in BATTERY, DEFENCE ELECT…, PE, LIB-ESS, SMS, PEU, and OTHERS and confirm its individual tooltip appears.
- Confirm no Sub Group or PC Short Name is silently grouped, truncated from the data, or replaced by “Other Division.”
- Re-run the Sales Dashboard analytics tests and desktop/mobile interaction checks.
