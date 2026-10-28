# Production Planning: keep only "Daily Production Report"

## What changes
- The Production Planning section on the launchpad shows one card: **Daily Production Report**, which opens a "coming soon" page like the Purchase screens did at first.
- These 4 cards are removed from the launchpad and from Screen Permissions: Open Production Orders, Schedule Adherence, Capacity Utilisation, Output Trend.
- Screen Permissions lists Production Planning with the single child **Daily Production Report**, ticked for Admin and Sharvi Admin by default.

## Technical details
- `src/lib/screens.ts`: replace the 4 `pp.*` children with `{ key: "pp.daily-production-report", label: "Daily Production Report", tileKey: "pp_daily_production" }`.
- `src/lib/sap-modules.ts`: replace the 4 PP tiles with one `pp_daily_production` tile; `tile-card.tsx` icon map updated (Factory).
- New route `src/routes/_authenticated/reports/pp/daily-production-report.tsx` using `ReportShell` + `ModuleComingSoon` + `hasScreen` guard, with its own head().
- Migration (also saved to `deploy/production-planning/daily-production-report.sql`, idempotent): delete the 4 old PP tiles and their screen permission rows; insert the new tile and screen permission for admin/super_admin. Additive-safe rerun guards.
- Test: PP module has exactly one child `pp.daily-production-report`.
