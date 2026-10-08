# Keep Sales Zone and Plant charts in a single row

## Why they split
Both charts currently calculate a maximum number of bars from the available width and move the remaining categories into a second chart underneath. This repeats the axes and uses extra height.

## Changes
- Keep **Open Order Lines by Sales Zone** and **Plant-wise Pending** side by side on desktop.
- Show every zone in one continuous chart and every plant in one continuous chart—remove the second chart row and repeated axes.
- Fit categories by reducing bar widths and gaps dynamically. Retain the distinct radiant colors.
- Use compact 45° zone labels; use plant codes below bars with full plant names in tooltips. Keep full zone names in tooltips too.
- Keep actual-value/count labels above bars where they fit; use compact positioning to prevent overlap.
- Keep each plot approximately 200px high, with no horizontal scrollbar.
- On narrow phones, stack the two cards but keep each chart’s categories in one row.

## Unchanged
Keep all zones and plants, filters, calculations, plant totals, tooltip values, detailed table, Refresh, PDF and Excel unchanged. This adjustment reduces these two cards’ height; it does not promise that the entire dashboard fits a single viewport.

## Technical details
Remove width-based dataset chunking in the two screen charts. Calculate bar size and label space from the full category count. Keep the existing PDF Sales Zone rendering separate.

## Checks
Verify at the current 901px preview width and at a wider desktop width that both cards remain side by side, each contains one chart row, every category remains present, and labels do not overlap. Check phone layout, gradient colors, tooltips and unchanged totals.
