# Make Main Group drill-down always respond to clicks

## Finding

Clicking the colored bar itself already drills into sub groups (verified in the preview — the "← All main groups" back link appears and the chart redraws). The problem is the click target: only the bar rectangle reacts. Clicking the group **name** under the axis, the **value label** above the bar, or a very short bar (e.g. CORPORATE at 1.20 L) does nothing, so it feels broken.

## What changes

In the "Main Group vs Sub Group (Amount)" card:

1. **Click the name too** — the group names along the bottom axis become clickable; clicking a name drills into that group's sub groups, same as clicking its bar.
2. **Click the value label too** — the amount shown above each bar drills in as well.
3. **Small bars stay clickable** — every bar gets a minimum hit area so even tiny-value groups respond to a click.
4. **Back to main groups** — the existing "← All main groups" link keeps working, and sub-group bars/labels are not clickable further (no deeper level exists), exactly as today.
5. Drill-down keeps working the same in full-screen view.

## Technical notes

- `src/components/sd-live-dashboard.tsx`, `MainGroupBars`:
  - Custom X-axis tick renderer that wraps the name in a clickable element calling the same `setSelected` handler (only when not drilled in).
  - Custom `LabelList` content renderer with an onClick that drills in, plus `cursor: pointer`.
  - `minPointSize` on the `Bar` so near-zero bars keep a few pixels of clickable height.
- No data, query, or schema changes.
