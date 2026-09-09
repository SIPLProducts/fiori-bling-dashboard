# Launchpad — replace the SD tile with a live Total Sales card

The plain "SD — Sales & Distribution" tile on the home launchpad (title, subtitle, small grid icon) becomes a rich live card styled exactly like the Total Sales tile on the Net Sales dashboard.

## What the new card shows

1. **Header** — "TOTAL SALES" in small caps with the ₹ icon badge at top-right.
2. **Value** — the real current Net Sales total from the synced ZFISALES_DETAIL data, large, in Cr / L units (e.g. ₹4,063.29 Cr).
3. **Caption** — "Filtered postings · click for details".
4. **Share bars** — Domestic / Service / Exports with each one's percentage of the total, in the same three accent colours used on the dashboard.
5. **Click** — opens the Net Sales dashboard, same as the tile does today.

## Behavior

- Values are computed live from the synced table each time the launchpad loads — no hardcoded numbers; they match the Net Sales screen exactly.
- Only the "SD — Sales & Distribution" tile changes; the other launchpad tiles (Net Sales, Open Sales Orders, Backorders, Sales Trend) stay as they are.
- Loading state shows a skeleton card of the same size; if data is unavailable the card falls back to the current plain tile look.

## Technical notes

- New small server function that returns total amount and the three segment shares from `zfisales_detail` (server-side aggregation, so the launchpad does not download all rows).
- Launchpad replaces that tile with a dedicated card component that reuses the dashboard's `KpiCard` share-bar styling and `compact()` Cr/L formatter.
- No schema, sync or permission changes.
