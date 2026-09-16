# Store every SAP row and refresh it safely

## Confirmed limitation
The SAP payload shown has no guaranteed permanent line identifier. Fields such as `GJAHR`, `BELNR`, `POSNR`, `HKONT`, and `PRCTR` can form a useful business reference, but they cannot guarantee uniqueness when SAP returns repeated accounting lines. A hash of the complete row preserves different rows, but it also cannot identify an existing row after any value changes.

## Update model
Treat each SAP response as the complete current snapshot for that exact saved request:

1. Build a **sync scope key** from the endpoint and identifying request filters, such as company, posting-date window, profit centre, and plant.
2. For every row received, build an **occurrence key** from:
   - the sync scope key,
   - the complete canonical SAP row hash,
   - and that identical row’s occurrence number within the response (`1`, `2`, `3`, etc.).
3. Save every occurrence. If SAP sends 4,180 array entries, all 4,180 are represented in the database, including 26 byte-for-byte duplicate rows.
4. After the full new snapshot is stored successfully, remove the older rows belonging to that same sync scope. This makes changed or deleted SAP rows correct without guessing an unreliable unique key.
5. If fetching or saving fails, retain the prior completed snapshot so the report never becomes partially empty.

## Changes

1. **Database identity and snapshot tracking**
   - Add snapshot/scope fields needed to distinguish separate endpoint requests and repeated identical rows.
   - Replace the current full-row-hash-only uniqueness rule with the scoped occurrence key.
   - Preserve the original SAP object in `raw` and continue mapping its report fields.

2. **Atomic sync flow**
   - Stage every received row under a new snapshot identifier in batches.
   - Validate that the staged count equals the received count.
   - Activate the new snapshot and remove the previous snapshot for only that request scope.
   - Record received, stored, replaced, invalid, and failed counts in run history.

3. **Apply everywhere**
   - Use the same snapshot behavior for scheduled middleware sync, manual Test sync, and direct SAP push.
   - Rebuild the middleware’s shared sync bundle so Quality and Production use identical mapping.

4. **Scheduler health details**
   - Show **Received**, **Stored**, **Replaced**, and **Invalid** clearly.
   - Expanded run details will show the request scope and confirm that exact repeated rows were preserved.
   - Remove “exact duplicates skipped,” because identical occurrences will no longer be discarded.

5. **Safe transition**
   - Deploy to Quality first.
   - Clear the old hash-key data once, run each required SAP request, and verify that 4,180 received produces 4,180 rows for that request scope.
   - Verify all request scopes together produce the expected total before repeating the one-time reset in Production.

6. **Tests**
   - Two identical SAP objects in one response are both stored with different occurrence keys.
   - A later successful run replaces the prior snapshot for only the matching request scope.
   - Different profit-centre/date request scopes do not delete each other.
   - Failed or partial writes leave the previous snapshot active.

## Important behavior
There is no guessed SAP unique key. Updates are handled by replacing the complete snapshot for the same request scope. This is the only reliable way, with the fields currently supplied, to both preserve every received row and reflect later SAP changes or deletions.
