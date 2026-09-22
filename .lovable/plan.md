# Remove duplicate launchpad cards in Production

## Confirmed cause

- The Production screenshot shows duplicate database-backed cards: Total Sales, Open Sales Orders, Open Receivables, and Open Payables.
- The launchpad fetches every row from `public.tiles` and renders each row using its unique database ID. It does not create a second copy of these cards in the page code.
- `public.tiles` has no uniqueness rule for a card's stable identity. Older migrations inserted the same logical cards more than once with different IDs, so Production can retain duplicates after repeated/manual imports.
- The FI/PP overview card is intentionally created once by the page. It is not the source of the duplicated KPI cards.

## Changes

1. **Clean Production safely**
   - Inspect duplicate groups by module and stable card identity before deleting anything.
   - Keep one canonical row per logical card, preferring the current route, screen permission, and sort order.
   - Remove only extra rows; preserve roles, permissions, KPI data, and report routes.
   - Reapply the existing retired-card cleanup and the corrected Open Sales Orders route.

2. **Prevent recurrence**
   - Add a database uniqueness rule for non-empty `kpi_key` within each module.
   - Add a safe identity rule for launch cards without a KPI key, using module plus destination/title as appropriate.
   - Make launchpad seed/upgrade SQL use upsert or insert-if-missing behavior rather than creating new IDs on every run.

3. **Add a self-hosted repair script**
   - Provide one idempotent SQL file for Quality and Production that deduplicates current rows, aligns the expected SD/FI/PP/Tables cards, and reloads the API schema.
   - Do not touch SAP settings, synchronized sales data, users, or screen permissions.

4. **Verify Production**
   - Confirm each expected card appears exactly once.
   - Confirm Total Sales and Open Sales Orders buttons still open their current reports.
   - Confirm FI and PP overview cards remain once, permissions still hide ungranted screens, and no retired cards return.
   - Hard-refresh the published page after applying the repair.

## Immediate operational note

Do not rerun broad setup scripts to fix this; some older setup steps can reseed unrelated SAP settings. Apply only the dedicated launchpad repair SQL to `mis_p_db`.