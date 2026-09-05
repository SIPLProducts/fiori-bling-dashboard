# Top 10 cards — consistent style, tooltips, full screen

## What changes

1. **Top 10 Materials** uses the same layout as the other Top 10 cards (Profit Centres, Customers, Sales Employees): one-line name, proportional bar, amount on the right under an "Amount" header.
2. **Tooltips everywhere a value can be cut off** — hovering a name or an amount in any of the four Top 10 cards shows the full name, the exact amount, and the number of records behind it.
3. **Full-screen view for all four Top 10 cards** — each gets the same expand icon used by the other charts, opening the list large in an overlay, closed with Escape or the close button.

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - Top 10 Materials panel switches from `RankedList` to `BarList` (distinct accent tone). `RankedList` stays in the file, unused there.
  - `BarList` accepts an optional `count` per item and renders a `title` attribute on the name, bar row, and amount: `"<name> — ₹<exact amount> · <n> records"`.
  - All four Top 10 panels get `expandable` (existing `Panel` full-screen support) and pass `full` to `BarList` so rows stretch to the dialog height.
- `src/lib/sd-live.ts`: no change — `NamedTotal` already carries `count`, and all four lists already return 10 items.
