# Show exact duplicate SAP rows

## Goal
Make every new SAP sync explain which rows were treated as exact duplicates, instead of showing only a number such as “26 exact duplicates.”

## Changes

1. **Capture duplicate groups during row mapping**
   - Continue generating each identity as `sha256:` plus the SHA-256 hash of the complete SAP row with consistently sorted field names.
   - When the same identity appears again in one SAP response, record its hash, total occurrences, duplicate count, and the original SAP row.
   - Keep the existing behavior: one copy is stored in the sales table and additional exact copies are skipped.

2. **Save diagnostics with each sync run**
   - Add a JSON diagnostics field to the sync history.
   - Save the duplicate groups for manual tests, scheduled middleware syncs, and direct SAP pushes.
   - Keep diagnostics bounded: store up to 100 duplicate groups per run and record whether more groups were omitted, preventing unusually repetitive responses from making run history too large.
   - Do not store the entire SAP response again; only rows proven to be exact duplicates are retained in diagnostics.

3. **Show duplicates in Scheduler health**
   - Add separate **Duplicates** and **Invalid** counts instead of combining them only as “Skipped.”
   - In an expanded run, show a duplicate table with the row hash, occurrence count, duplicate count, and the SAP field values.
   - Provide a copy action for each duplicate row so it can be compared with SAP output.
   - Older runs without saved diagnostics will continue to display their existing totals and a clear “details not recorded” message.

4. **Keep all sync paths consistent**
   - Apply the same diagnostics shape to portal-triggered sync, middleware manual sync, scheduled sync, and the public push endpoint.
   - Rebuild the shared middleware sync bundle and update its version/documentation so Quality and Production run identical logic.

5. **Verify accounting and display**
   - Add tests proving duplicate groups report the correct hash, occurrence count, and original row.
   - Verify the reconciliation remains: `received = unique + exact duplicates + invalid`.
   - Verify a new run showing 4,180 received and 26 duplicates stores 4,154 unique rows and exposes those 26 duplicate occurrences in the expanded run.

## Important behavior
A duplicate means the complete SAP rows are identical after stable field ordering. If any SAP value differs, the row receives a different hash and is stored separately.
