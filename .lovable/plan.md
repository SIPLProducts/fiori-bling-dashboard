# Correct stacked-chart colors and tooltip mapping

## Confirmed issues

- The drilled chart currently assigns 17 PC Short Names from a 10-color palette using modulo indexing, so later divisions reuse earlier colors.
- Small-segment hover areas are enlarged to 14px and can overlap. The current pointer logic gives the SVG element under the cursor priority, which can select a neighboring segment instead of the visually nearest segment.
- Actual amounts and counts are already stored separately from the minimum display values, so the correction can preserve all totals and ₹0 behavior.

## Changes

- Replace the repeating division palette with a larger set of distinct, light, accessible chart colors so every active PC Short Name has a unique color.
- Build one stable PC Short Name-to-color map and use it consistently for stacked slices, the PC Short Name legend, hover highlighting, and tooltip swatches.
- Correct hover resolution in each Sub Group bar:
  - consider every segment target under the same bar,
  - select a segment containing the pointer in its real displayed slice first,
  - otherwise select the nearest real slice by vertical distance,
  - do not let SVG drawing order override the nearest segment.
- Keep enlarged hover areas for tiny and ₹0 divisions, but ensure overlapping areas resolve to the correct PC Short Name.
- Make the tooltip unambiguous with separate rows for Sub Group, PC Short Name, Amount, and Records, plus the matching segment color swatch.
- Continue using the actual stored amount and count in the tooltip—not the minimum display value used to make tiny and ₹0 slices visible.
- Preserve horizontal scrolling, compact bars, amount labels, full division list, viewport-safe tooltip positioning, filtering, and drill-down behavior.

## Verification

- Verify all seven BATTERY divisions have different colors: VZNM, VNCPP, NCPP, NGN, NCFP, CS-SPT, and NGN BTY.
- Verify DEFENCE ELECTRONICS resolves SPI to ₹42.16 Cr / 42 records and PCB to ₹0 / 2 records.
- Hover every segment in PE, LIB-ESS, IPS, INDUSTRIAL BATTERIES, SMS, PEU, and OTHERS and confirm the PC Short Name, amount, and record count match that segment.
- Confirm tiny adjacent slices no longer return a neighboring segment’s details.
- Confirm every legend swatch matches its corresponding stacked slice in light and dark themes.
- Run the focused Sales Dashboard analytics tests and inspect the drilled chart at desktop and narrow widths.
