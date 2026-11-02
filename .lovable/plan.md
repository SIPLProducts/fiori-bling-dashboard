Make the "Price by day/month/quarter/year" table header use the same radiant colour band (blue → teal → purple, white text) as the "Purchases by date" header, in Light, Dark and Glassy.

Technical: in `src/components/material-price-page.tsx` line 141, replace `bg-foreground text-background` with `text-on-radiant` and the same gradient style used on line 167. No data changes.
