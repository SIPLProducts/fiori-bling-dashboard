# Cash Flow ledger: show full page, no inner scroll

## Current state
The transaction table box is capped at about 110px tall on desktop (about 90px on short windows), so only 3–4 of the default 10 rows show and the rest need an inner scroll.

## Change
- Remove the height cap and inner vertical scroll from the ledger table.
- By default the table shows all 10 rows of the page plus the Total row. Choosing 50, 100 or 500 per page makes the ledger card taller to fit those rows, and the page scrolls normally.
- Horizontal scroll for wide columns stays. Everything else (compact fonts, filters in one row, charts) stays the same.

Because of this, the page will scroll down to reach the full table, so "fit on one screen" only applies to the cards above it.

## Technical details
- `src/styles.css`: delete the two `.cash-table-scroll { max-height: ... }` rules (the min-width 900px rule and the one inside the max-height 600px block), and the sticky thead/tfoot rules that were only needed for the inner scroll.
- Verify with Playwright at 949×529 and 1280×720: 10 rows visible with no inner scrollbar; 50/page increases the card height.
