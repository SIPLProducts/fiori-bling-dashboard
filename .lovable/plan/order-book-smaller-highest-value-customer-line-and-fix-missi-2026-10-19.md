# Order Book: smaller Highest Value customer line and fix missing quarter bars

## 1. Highest Value tile
- The "Customer: …" line under the value uses a smaller font (11px instead of 12px), truncated to one line with the full name on hover. Only the Order Book tile changes.

## 2. Quarter card bars not showing
- The Order Book table is currently empty (it was cleared for re-sync), so the cause cannot be confirmed from data yet.
- Likely cause: the shortened chart (96px) leaves almost no room for bars after the month axis and value labels, so the bars collapse to nothing while the card total (e.g. 263.92 Cr) still shows.
- Steps:
  1. After you sync Order_Book again, open the screen in a test browser and confirm the bars are missing and why.
  2. Fix the chart sizing: chart height about 120px, smaller month-axis height, no top value labels clipped; keep the card overall compact.
  3. Recheck that every month with value shows a bar, and that the PDF matches.
- Net Sales quarter cards stay unchanged.

## Technical details
- `SummaryCard` gets an optional small sub-value style used by Order Book's Highest Value.
- `QuarterCard` compact mode: height `h-28`, `XAxis height={16}`, adjusted margins; verify with Playwright screenshot once `order_book` has rows.
