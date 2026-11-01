# Material Price Movers: tiles inside the card, coloured border

## Changes
- Move the 4 summary tiles (Materials tracked, Rising, Falling, Average change) inside the Material Price Movers card, just under its title.
- Show the 4 tiles in one row from tablet width up (your current window included). On phones they show 2 per row.
- Make the tiles a little smaller so all four fit in one row.
- Give the Material Price Movers card a coloured border: a gradient border running blue → teal → purple → orange, with a soft matching glow.
- Fix the dark text on these coloured tiles in Glassy mode (seen in the screenshot) so it is always white. The same fix applies to the coloured tiles on the material screen and the main Purchase Register tiles.

## Technical details
- `material-trend-card.tsx`:
  - Render the KPI grid inside the `<section>` using `grid-cols-2 md:grid-cols-4`.
  - Wrap the section in a gradient-border container (`p-[2px]` padding with a `linear-gradient` of radiant colours, inner `bg-card`).
- `src/styles.css`:
  - Add an `--on-radiant` token (white in every theme) and a `text-on-radiant` utility.
  - Use it in place of `text-primary-foreground` on the radiant tiles in `material-trend-card.tsx`, `material-price-page.tsx` and `purchase-register-dashboard.tsx`.
- Changes are only on screen.
