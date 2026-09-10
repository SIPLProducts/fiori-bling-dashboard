# Rolling posting-date window for SAP endpoints

Today the two posting dates are fixed values saved inside the request payload, so once
saved they never move — the endpoint keeps sending 01-06-2026 to 31-07-2026 forever.

## What changes

In **Administration → SAP API Settings → Request**, the posting date row becomes:

- A **Posting date range** dropdown beside the two date pickers:
  - Last 7 days (default)
  - Last 1 month
  - Last 6 months
  - Last 1 year
  - Custom dates
- Picking any preset immediately fills the two pickers (To = today, From = today minus
  the chosen span) and updates `BUDAT_F` / `BUDAT_T` in the payload, so what is on screen
  is exactly what is sent.
- The manual pickers stay usable. Touching either one switches the dropdown to
  **Custom dates** and keeps that exact window.

## Rolling behaviour

When a preset is selected, the window is **recalculated at the moment of every call** —
scheduled sync, Test connection, manual run. So with "Last 7 days":

- Run on 10-09-2026 sends `BUDAT_F=20260904`, `BUDAT_T=20260910`
- Run on 11-09-2026 sends `BUDAT_F=20260905`, `BUDAT_T=20260911`

With **Custom dates** the saved dates are sent unchanged, as today.

## Technical notes

- Migration: add `posting_range text not null default 'custom'` to `public.sap_endpoints`
  (allowed values `last7d`, `last1m`, `last6m`, `last1y`, `custom`). Existing rows keep
  `custom` so nothing changes until a preset is chosen. Grants/RLS unchanged.
- `src/lib/sap-pull-shared.ts` → `withPostingDates(raw, range)`: when `range` is a preset,
  always overwrite `BUDAT_F` / `BUDAT_T` with the computed window; when `custom`, keep the
  current behaviour (only fill in missing/invalid values). Shared helper `postingWindow(range)`
  returns the two `YYYYMMDD` strings.
- Callers pass the endpoint's `posting_range`: `src/lib/sap-api.functions.ts` (test/run),
  `src/lib/sap-pull.server.ts`, and `middleware/scheduler.mjs` (add `posting_range` to its
  endpoint `select`). The middleware bundle `middleware/sync-core.mjs` is regenerated from
  `middleware/src/sync-core.entry.ts` via `npm run build:sync-core`.
- `src/routes/_authenticated/admin/sap-api.tsx`: add the dropdown next to the pickers,
  wire it to the form state and to `applyPayloadValues`, and disable/keep-editable the
  pickers per selection. Preset selection also refreshes the payload preview on load so the
  screen shows the window that will actually be sent.

## Deploying to Quality/Production

The migration runs on the hosted database automatically; on the self-hosted servers apply
the same migration, then `git pull`, `npm run build:sync-core`, and restart the middleware
process so the scheduler picks up the rolling window.
