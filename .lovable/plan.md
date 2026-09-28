# Stable Sales dashboard refresh

## Goal
Keep figures stable while a user is viewing any Sales report. Newly synchronized SAP data becomes visible only after a deliberate user action that reloads the report.

## User experience
- Add a **Refresh** action to the Sales module dashboard, Sales Analytics, Sales KPI, and Management Dashboard headers.
- Show a short loading state while refreshed figures are fetched, then confirm completion without disrupting the current filters.
- Reload the latest committed sales snapshot when the user:
  - clicks **Refresh**;
  - changes and applies filters;
  - leaves a Sales screen and later returns;
  - reloads the browser page.
- Do not update figures automatically while the user remains on the same screen.

## Data safety
- Remove the Sales-table live subscription and any periodic Sales report polling that can change visible figures mid-review.
- Keep the existing staged snapshot process: SAP rows remain invisible until validation and atomic Posting Date range activation succeeds.
- Failed or incomplete synchronization continues to leave the currently active reporting data unchanged.

## Technical details
- Use each report's existing query cache as the stable on-screen snapshot.
- Refresh by invalidating/refetching only that report's Sales query; preserve filter state.
- Keep query refresh-on-mount enabled for screen re-entry, but disable window-focus, reconnect, interval, and realtime-triggered Sales refreshes.
- Keep synchronization status polling separate where it does not alter report figures.
- Add focused tests for stable query behavior and run the existing Sales test suite.
