# Multiple daily SAP sync times

## Changes
1. Replace the single technical schedule input with a Daily Sync Times control that accepts multiple IST times per endpoint.
2. Store the selected times in the existing schedule field as one backward-compatible schedule expression, so no database migration is required.
3. Show the next scheduled runs in IST and keep existing saved cron schedules editable through an Advanced schedule option.
4. Update the middleware schedule matching so it evaluates the configured schedule consistently in IST, independent of server timezone.
5. Preserve the current one-run-per-minute and in-progress protections to avoid duplicate or overlapping syncs.
6. Add focused tests for 05:30 AM and 01:00 PM daily execution, schedule conversion, timezone behavior, and existing cron compatibility.

## Technical details
- Multiple daily times map to a standard expression such as `30 5,13 * * *` when minutes match; differing minutes use multiple comma-aligned schedule clauses in a backward-compatible serialized form.
- The UI owns conversion and validation; the middleware accepts both existing single expressions and the new multiple-time representation.
- Existing endpoint schedules remain unchanged until an administrator saves new daily times.
