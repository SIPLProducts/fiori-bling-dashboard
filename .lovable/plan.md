# Match Open Sales Orders text sizes to Net Sales

Reduce the text inside the Open Sales Orders launchpad card to match Net Sales, keeping all information visible.

## Changes
- Reduce description rows, line counts and row values from 11px to 9px, matching Net Sales breakdown text.
- Reduce the Total Open Orders label and line count to 9px for a consistent compact appearance.
- Keep the card heading at 11px, main amount at 26px and footer at 10px; these already match Net Sales.
- Preserve all bars, colors, totals, sync time, links and card layout. No changes to the report or PDF.

## Technical details
- Update only launchpad typography in `src/components/open-sales-orders-launch-card.tsx`.
- Verify readability and absence of clipping at the current 951px width, wider desktop and phone widths, in both appearance modes.