# Separate gradient colours for Refresh, Sync and Reset

## What you will see
On every screen, the three buttons get their own colours so you can tell them apart:
- **Refresh**: blue gradient, as it is now.
- **Sync**: purple-to-indigo gradient, white text.
- **Reset**: orange-to-amber gradient, white text.
- **PDF / Excel** stay teal-green.

Light and dark mode both keep these colours.

## Technical details
- In `src/styles.css`, add `--gradient-sync`, `--gradient-reset` and their shadows, plus `btn-sync` and `btn-reset` utility classes, built the same way as `btn-action`.
- In `src/components/ui/button.tsx`, add `sync` and `reset` variants.
- `SyncNowButton` uses `variant="sync"`. Every Reset button (TBN, Sales Register filters, Net Sales, Sales KPI, Open Orders/SIT/Order Book, Cash Flow) uses `variant="reset"`.
