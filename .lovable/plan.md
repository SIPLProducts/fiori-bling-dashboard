# Different bar colours in the Sales Register Top 10 cards

## What you will see
- In **Top 10 Customers**, **Top 10 Profit Centres** and **Top 10 Materials**, every bar gets its own colour (blue, orange, green, purple, red and so on), with the same soft fade-in look the bars have today.
- Rank 1 has the same colour in all three cards, rank 2 the same, and so on, so the cards look consistent.
- Names, amounts and the ₹ Cr label don't change. The PDF picks up the new colours automatically.

## Technical details
- In `RankList` (sales-register-dashboard.tsx), replace the fixed `var(--chart-2)` gradient with `COLORS[i % COLORS.length]`: `linear-gradient(90deg, <colour>99, <colour>)`, using the same hex palette as the donut.
