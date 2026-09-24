# Add horizontal scrolling for additional chart groups

## Changes

- Keep the current chart layout when the visible Main Groups or Sub Groups fit inside the card.
- Calculate the chart’s minimum width from the number of displayed bars in both states:
  - Main Group view: allocate a consistent minimum width per Main Group.
  - Sub Group view: allocate a compact minimum width per Sub Group.
- When the calculated width exceeds the available card width, enable horizontal scrolling inside the chart area.
- Keep every Main Group and every Sub Group in descending amount order; do not hide, cap, merge, or replace groups because of limited space.
- Keep bar widths, tight spacing, labels, stacked PC Short Name segments, focused tooltips, full legend, totals, and click-to-drill behavior unchanged.
- Ensure the chart remains full-width without an unnecessary scrollbar when only a few groups exist.

## Verification

- Verify Main Group scrolling with a large group list.
- Verify drilled Sub Group scrolling with all available Sub Groups.
- Confirm the last bar is reachable and tooltips still work after scrolling.
- Check desktop and smaller screen widths, then run the focused chart tests.
