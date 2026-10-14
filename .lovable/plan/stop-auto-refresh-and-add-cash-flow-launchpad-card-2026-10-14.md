# Stop auto-refresh and add Cash Flow launchpad card

## 1. Why screens refresh on their own

The portal reloads data whenever the login service reports "signed in". That signal fires again when you come back to the browser tab or the session renews quietly in the background, not only on a real sign-in. Each time it fires, Cash Flow, the Open Sales Orders launchpad card, the sync times and the launchpad itself all reload. The launchpad also reloads every time the tab gets focus after one minute.

Fix:
- Reload data only when a **different user** signs in or the user signs out. Coming back to the tab or a background session renewal does nothing.
- The launchpad stops reloading when the tab gets focus.
- Data changes only after you click Refresh (or Sync, for admins). Nothing refreshes on its own: no timers, no reload on tab focus, no background renewal. Sign out and sign in still load fresh data.
- This rule is saved permanently, so later changes keep data refreshing on Refresh click only.
- TBN keeps its existing live updates. That screen was built to update live, so it stays as it is.

## 2. Cash Flow card on the launchpad

The Cash Flow tile under Financial Accounting becomes a live card styled like the Open Sales Orders card:
- Heading "Cash Flow" with the Net balance in ₹ Cr as the main figure.
- Three labeled bars: **Credit**, **Debit** and **Net**, each with its ₹ Cr value. Values keep the same signs as the Cash Flow screen. Bar length is relative to the largest of the three, using the same colors as the screen (Credit teal, Debit orange, Net blue). Net is shown red when it is negative.
- A record count line (for example "1,536 GL records · 37 plants").
- Bottom: "Last synced: dd.mm.yyyy, hh:mm am IST" and a "View details" button that opens the Cash Flow screen.
- Covers all saved Cash Flow rows, with no date limits, the same as the screen's totals.
- Loads once and stays the same while you move around the portal. It updates only after Refresh or Sync on the Cash Flow screen, or a browser reload.
- If there is no data yet, the current plain tile is shown.

## Technical details

- `src/routes/__root.tsx`: track the last user id in a ref. In `onAuthStateChange`, ignore `TOKEN_REFRESHED`. Ignore `SIGNED_IN`/`USER_UPDATED` when `session.user.id` matches the stored id. Only invalidate the router and queries when the user actually changes, or on `SIGNED_OUT`.
- `src/lib/use-launchpad.ts`: add `refetchOnWindowFocus: false`, `refetchOnReconnect: false`.
- New pure helper `summarizeCashLaunch(rows)` in `src/lib/cash-flow.ts`: credit, debit and net totals (net = credit − debit, the same as `rowNet`), plant/GL counts, latest `synced_at` and bar shares. Add a unit test in `tests/cash-flow.test.ts` that checks the totals against a small fixed set of rows.
- New `src/components/cash-flow-launch-card.tsx`: paged read of `zcash_flow` (`credit,debit,plant,gl_code,synced_at`, 1,000 rows per page). Stable query key `["cash-flow-launch-summary","v1"]` with infinite stale/gc time and no refetch on mount, focus or reconnect. Uses the `lastSyncedLabel`, tokens and `--cash-*` colors already used by the Cash Flow screen.
- `src/components/tile-card.tsx`: render the card when `tile.kpi_key === "fi_cash_flow"` (fallback is the current tile).
- Cash Flow screen Refresh/Sync also invalidates `["cash-flow-launch-summary"]`, so the launchpad matches after a manual refresh.
- Check the launchpad at 951×529, 1280 and phone widths in light and dark mode. Leave the tab and come back, and confirm no new data requests are made.
