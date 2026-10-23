# Fixed card footer and short "Last Sync" line

## Change
- Every launchpad card (Net Sales, SIT, Sales Register, Order Book, Open Sales Orders, Cash Flow and the other tiles) keeps its footer pinned to the bottom of the card. Cards in a row line up even when one has more bars than another.
- When a card has many bars, the bar list scrolls inside the card so the footer stays visible.
- "Last synced:" becomes **Last Sync:** in smaller text (about 10px). The date and time stay on one line, with the Open Details button on the right of the same row.
- The Net Sales and Open Orders report screens use the same shorter wording.

## Technical details
- `lastSyncedLabel` in `report-sync-time.ts` returns "Last Sync: …".
- In `LaunchSummaryCard`, `net-sales-launch-card.tsx`, `cash-flow-launch-card.tsx` and `tile-card.tsx`, the card becomes `flex flex-col h-full`. The bar list gets `flex-1 min-h-0 overflow-auto`, and the footer gets `mt-auto` with `whitespace-nowrap text-[10px]`.
- The cards in each row stretch to equal height.
