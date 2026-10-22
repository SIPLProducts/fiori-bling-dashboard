# Sales & Distribution: all 5 cards in one row, smaller cards and text

## Why it still wraps
Your preview is about 890px wide, and the one-row layout only starts at 1280px. So you see 2 cards per row.

## Change (Sales & Distribution section only)
- All 5 cards (Net Sales, SIT, Dispatches, Order Book, Open Sales Orders) sit in **one row from 768px wide upwards**, which includes your current window. Phones still stack them.
- Smaller cards:
  - less padding inside each card and smaller gaps between them
  - lower card height (around 150px instead of about 370px), with fewer empty gaps
- Smaller text:
  - main figure ₹354.09 Cr: 26px → 18px
  - title (NET SALES, SALES IN TRANSIT): 11px → 10px
  - bar labels, values and sync time: 10px → 9px, with thinner bars
  - icon badge and Open Details button made smaller
- Long labels (e.g. "Sales In Transit (SIT)", "Domestic Sales") wrap or shorten with "…" instead of widening the card.
- Financial Accounting and other sections are unchanged.

## Technical details
- `launchpad.tsx`: S&D grid `grid-cols-1 md:grid-cols-5 gap-2`.
- Add a `compact` prop passed only from the S&D section to `TileCard`, `NetSalesLaunchCard`, `LaunchSummaryCard` (Open Orders / Order Book / SIT); it switches padding, font sizes, icon size, bar height and button size; `min-w-0` + `truncate` on text rows.
