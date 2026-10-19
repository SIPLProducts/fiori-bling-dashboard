# Order Book quarter bars: gradient colours

## Change
- On the Order Book screen, each quarter card's bars get a smooth top-to-bottom gradient in that quarter's colour (lighter at the top, full colour in the middle, deeper at the base), with rounded tops. This is the same look as the other Order Book charts.
- When two financial years are compared, each year gets its own gradient, and the legend and tooltip colours still match.
- Works in light and dark mode, and the PDF keeps the same colours.
- Values, labels, tooltips and the Sales dashboard quarter cards stay the same.

## Technical details
- Add an optional `gradient` prop to the shared `QuarterCard` (`sd-live-dashboard.tsx`). When it is set, render `<defs><linearGradient>` for each series using the existing `--order-gradient-light-share` / `--order-gradient-deep-share` colour-mix stops, and fill bars with `url(#id)`. IDs come from `useId()` so cards do not clash.
- Pass `gradient` only from the Order Book quarter row in `open-sales-orders-dashboard.tsx`.
