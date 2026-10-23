# Separate gradient colours for Refresh, Sync, Reset and PDF/Excel

## What you will see
On every screen, each button type gets its own gradient so you can tell them apart:
- **Refresh**: blue gradient, as it is now.
- **Sync**: green gradient (emerald to bright green), white text.
- **Reset**: orange-to-amber gradient, white text.
- **PDF / Excel**: green mixed with teal-blue (green to cyan-blue), white text, so it looks different from Sync.

Light and dark mode both keep these colours.

## Technical details
- In `src/styles.css`, add `--gradient-sync` (green), `--gradient-reset` (orange/amber) and their shadows, plus `btn-sync` and `btn-reset` utility classes built the same way as `btn-action`. Change `--gradient-export` to a green-to-cyan/blue mix.
- In `src/components/ui/button.tsx`, add `sync` and `reset` variants.
- `SyncNowButton` uses `variant="sync"`. Every Reset button (TBN, Sales Register filters, Net Sales, Sales KPI, Open Orders/SIT/Order Book, Cash Flow) uses `variant="reset"`. PDF/Excel buttons already using `export` / `btn-export` pick up the new mix automatically.
