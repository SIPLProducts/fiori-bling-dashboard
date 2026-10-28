# Rename Daily Production Report to "PP Overview Daily Production Report"

## What changes
- The single Production Planning card on the launchpad, its screen title, browser tab title and the Screen Permissions row all read **PP Overview Daily Production Report**.
- The section heading "Production Planning" stays as is.
- Link and permission stay the same, so existing access is unaffected.

## Technical details
- `src/lib/screens.ts` and `src/lib/sap-modules.ts`: label updated.
- `src/routes/_authenticated/reports/pp/daily-production-report.tsx`: title, head() meta, AccessDenied/ComingSoon text.
- Data update on `public.tiles` title for `screen_key = 'pp.daily-production-report'`; same UPDATE appended to `deploy/production-planning/daily-production-report.sql`.
- Update test label check.
