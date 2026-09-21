# Fix Production sync-history schema mismatch

## Confirmed issue

The Production portal requests the new snapshot-sync fields from `sap_sync_runs`, but the Production database does not contain `records_stored`. The same unapplied upgrade also adds `records_replaced`, `records_invalid`, `sync_scope_key`, and `snapshot_id`, plus the snapshot fields and activation function used by sales synchronization.

This is why the history request returns HTTP 400. It is unrelated to SAP connectivity, the password, TLS, or the Node.js warning.

## Recovery plan

1. Back up the Production database before changing its structure.
2. Apply the existing snapshot-sync migration to Production rather than adding only the single reported column.
3. Verify all required columns exist on `sap_sync_runs` and `zfisales_detail`, and verify `activate_zfisales_snapshot` exists.
4. Reload the portal and confirm the sync-history request returns HTTP 200.
5. Run one manual Production sync and confirm Received, Stored, Replaced, and Invalid are recorded.
6. Confirm the active sales-row count matches the completed snapshot before restoring the schedule.

## Important follow-up

The middleware shared secret, SAP password, and database service credential were pasted into chat. Rotate all three after recovery and recreate the Production middleware process with the updated values.
