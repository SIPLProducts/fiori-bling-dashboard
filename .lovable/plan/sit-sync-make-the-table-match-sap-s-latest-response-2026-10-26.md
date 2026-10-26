# SIT sync: make the table match SAP's latest response

## Current behaviour
Each SIT sync adds new lines and updates existing ones (matched on document number + line item). It never removes anything, so lines SAP no longer returns (already delivered, no longer in transit) stay on the screen. When SAP returns nothing, the table is left as it was.

## New behaviour
After every successful SIT sync, the table holds exactly what SAP returned:
- **New lines** in the response are added.
- **Existing lines** in the response are updated.
- **Lines missing** from the response are deleted.
- **SAP returns no records:** all SIT lines are deleted, so the screen shows 0. This only happens when SAP answers successfully with an empty list.
- **SAP call fails or returns an error:** nothing is deleted and the current data stays.

The sync history message will say, for example: "1,020 added or updated, 45 removed".

## Technical details
- `storeSitPayload` in `src/lib/sap-pull.server.ts`: keep the batched upsert on `vbeln,posnr`. Then load the existing `(vbeln, posnr)` keys with paginated reads, work out which keys are not in the response, and delete them in batches. With an empty successful response, delete every row. If anything fails partway, mark the run as failed and stop, with no further deletes.
- Add a pure helper `staleSitKeys(existing, incoming)` in `src/lib/sit-map.ts`, and use the same logic in the middleware copy (`middleware/src/sync-core.entry.ts` / `sync-core.mjs`) so scheduled syncs behave the same way.
- Tests in `tests/sit.test.ts`: lines missing from the response are flagged for removal; lines in the response are kept; an empty response flags every line.
- Replace the SIT upsert rule in `AGENTS.md`: SIT mirrors the latest successful SAP response, and lines missing from it are deleted.
