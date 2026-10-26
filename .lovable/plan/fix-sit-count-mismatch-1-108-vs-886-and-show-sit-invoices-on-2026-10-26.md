# Fix SIT count mismatch (1,108 vs 886) and show SIT Invoices on launchpad

## Cause (confirmed in code)
- Your server's sync program (`middleware/scheduler.mjs`) only adds/updates SIT lines; it never removes lines SAP no longer returns. So 886 new lines were saved, but ~222 old lines from earlier syncs stayed, giving 1,108. The "886 stored, 0 replaced" message comes from this program.
- The removal rule added earlier lives only in the portal's own sync, not in this program.
- The launchpad SIT card counts lines, not invoices.

## Changes
1. **Sync program**: after a successful SAP reply, delete SIT lines (VBELN + POSNR) not in the reply; empty successful reply clears the table; failed call deletes nothing. Message becomes "886 added or updated, N removed".
2. **Launchpad SIT card**: replace "1,108 SIT lines" with "X SIT Invoices" (distinct SIT invoice numbers), and each bar (Domestic SIT / Export SIT) shows "X SIT invoices" instead of lines.
3. Test: launchpad SIT counts distinct invoices; stale-key removal reused from shared helper.

## After deploy
Copy the updated `middleware/scheduler.mjs` to Quality/Production, restart it, then press Sync once — the count will drop to match SAP (886 lines).

## Technical
- scheduler.mjs SIT branch: fetch existing `vbeln,posnr`, use `staleSitKeys`, delete in batches after upsert.
- `open-sales-orders-launch-card.tsx`: for SIT, use distinct `vbeln` counts for header and per-group bars.
