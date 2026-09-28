# Fix the SAP scheduler function lookup

## Confirmed issue
- The scheduler calls `activate_zfisales_snapshot` with all five required inputs: scope, snapshot, expected count, Posting Date from, and Posting Date to.
- The current database contains that exact five-input function.
- The error shown means the database API used by the scheduler cannot see that function in its schema cache. This normally means either the production database has not received the latest migration, or its API schema cache was not refreshed afterward.
- The failure occurs before activation, so no new rows were stored or replaced in these runs; existing live Sales data remains unchanged.

## Resolution
1. Check the function signature in the exact production database connection used by the scheduler.
2. If missing, apply the existing five-input activation migration there; do not create a second variant.
3. Reload the production database API schema cache so the existing function becomes callable.
4. Run one controlled synchronization and verify non-zero Received/Stored values, successful atomic replacement, and no duplicate active date ranges.
5. Confirm the Sales dashboard still changes only when the user clicks its Refresh button.

## Safety
- Do not delete existing active Sales data manually.
- Keep the staged snapshot and rollback protection unchanged.
- If SAP retrieval or validation fails, retain the current live dataset.
