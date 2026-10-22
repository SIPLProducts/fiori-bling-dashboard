# Sales & Distribution cards: small Open Details button beside Last synced

## Change (Sales & Distribution section only)
- The Open Details button becomes a small pill (just fits its text, no longer full card width), at the bottom of each card.
- It sits on the same line as "Last synced ..." / "Sync time unavailable" / "Dispatch reporting", on the right side.
- When the card is too narrow for both, the button text shortens to **Open** (arrow kept); the sync text wraps instead of pushing the button out.
- Applies to Net Sales, SIT, Dispatches, Order Book and Open Sales Orders. Financial Accounting and other sections unchanged.

## Technical details
- Footer in `LaunchSummaryCard`, `NetSalesLaunchCard`, and `TileCard` (compact mode): `flex items-center justify-between gap-2`, sync text `min-w-0 flex-1`, link `shrink-0 h-6 px-2.5 text-[9px]` with `w-auto`.
- Use a container query (`@container` on the footer) to show "Open Details" when wide and "Open" when narrow (`hidden @[260px]:inline` / `@[260px]:hidden`); aria-label stays "Open <title> details".
