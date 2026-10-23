# Show the full Last Sync time on launchpad cards

The date and time are cut off because the label and the "Open Details" button don't fit on one line together.

## Change
- Use a shorter label on the cards: **Last Sync: 23.10.26, 1:20 pm** (2-digit year, no "IST" suffix on the card). Hovering over the label still shows the full IST time.
- On the five Sales & Distribution cards, the button reads **Open →** so the full time fits beside it.
- Report screens keep the full "Last Sync: 23.10.2026, 01:20 pm IST" wording.

## Technical details
- Add `lastSyncShortLabel` to `report-sync-time.ts`, with a test. Use it, with a full-time `title`, in the footers of `LaunchSummaryCard`, `net-sales-launch-card` and `cash-flow-launch-card`.
- Hide `.launch-details` inside `.sd-compact` footers and remove `truncate` from the label.
