# Top 5 profit centres card + label and list tweaks

## Changes

1. **New "Top 5 Profit Centres by Amount" card** — matching the reference: profit centre name on the left in one line (small font, no wrapping, truncated with hover), a blue bar, and the amount right-aligned with a "Amount (₹ Cr)" column header. Values come from the profit-centre totals already computed for the dashboard.
2. **Top customers** — customer names render smaller so each fits on a single line, still truncated with full name on hover.
3. **Top 5 materials** — the footer row changes from "N line(s)" to "N records", and the two figures swap places: the badge on the right now shows the amount, and the footer shows the percentage.

## Technical notes

- `src/lib/sd-live.ts`: expose the existing profit-centre aggregate as `topProfitCentres` (top 5) on `SdAnalytics`; it is already built internally as `byPc`.
- `src/components/sd-live-dashboard.tsx`:
  - Add a `ProfitCentreBars` list component (name / proportional bar / amount in Cr) rendered in a new panel placed before "Top 5 materials".
  - `HBar`: reduce the category tick font size (10px) and keep single-line truncation for customer names.
  - `RankedList`: swap badge/footer content (badge = amount, footer right = percentage) and relabel the count as "records".
- No data, query, or schema changes.
