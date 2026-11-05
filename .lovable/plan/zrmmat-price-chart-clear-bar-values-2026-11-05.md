# ZRMMAT price chart: clear bar values

## Problems seen
- The value on each bar sits right where the red trend line's dot is, so the line covers it.
- The bar's colored outline also gets drawn around the value text, so the numbers look blurry.
- The lowest month's bar comes out almost flat (May-26 has no visible bar), because the scale starts at that month's price.

## What changes
1. Value labels move a little above the bar top and the line dot. They are drawn as plain dark text on a small white rounded badge, with no outline, so they read clearly over the line.
2. The trend line is drawn behind the labels, and its dots are smaller.
3. The scale starts a little below the lowest price and ends a little above the highest. Every month then shows a visible bar, and the top label has room.
4. More space at the top of the chart so the highest label isn't cut off.

## Technical details
- File: `src/components/zrmmat-compare-card.tsx` only.
- Put the `LabelList` on a separate transparent `Bar`/after the `Line` (render order), with a custom `content` that draws a `rect` + `text` (no stroke), offset ~14px above.
- Remove `stroke` from the label (Cell stroke stays on the bar only).
- YAxis `domain={[(min) => min - pad, (max) => max + pad]}` with pad = 10% of range (min 1% of value); chart `margin.top` 28.
