# Live Open Sales Orders Launchpad Card

## Changes
- Replace the Open Sales Orders card’s current sample `1.3K` value with a live count from the active Open Sales Orders table.
- Count only rows whose **Order Date** falls from 1 April of the current financial year through today.
- Match the report’s opening Document Type selection by counting only **ZDOR**, **ZEOR**, and **ZSOR**.
- Show the latest active-row update time on the card in the same friendly style as Net Sales, such as **Updated 4 mins ago**, with the exact India-time timestamp available on hover.
- Keep the existing card title, cart icon, and View details link.
- Show a loading placeholder while the card value is being fetched and retain the existing card as a safe fallback if live data cannot be read.

## Verification
- Compare the displayed count with the active table rows for the current April–March financial year and the three selected document types.
- Confirm the displayed update time comes from the newest matching active row.
- Confirm the card links to the Open Sales Orders screen and renders correctly on desktop and mobile.
- Run focused checks and confirm preview health.

## Technical details
- Add a dedicated live launchpad card following the existing Net Sales card pattern.
- Query active rows with a database-side exact count and latest `updated_at`, constrained by `order_date`, `order_type`, and `is_active_snapshot`.
- Use a stable query key containing the financial-year date bounds so the count remains consistent with the selected period.
