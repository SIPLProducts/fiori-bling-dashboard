# Fix Production sync-history schema mismatch

## Confirmed issue

The Production portal requests the new snapshot-sync fields from `sap_sync_runs`, but the Production database does not contain `records_stored`. The same unapplied upgrade also adds `records_replaced`, `records_invalid`, `sync_scope_key`, and `snapshot_id`, plus the snapshot fields and activation function used by sales synchronization.

This is why the history request returns HTTP 400. It is unrelated to SAP connectivity, the password, TLS, or the Node.js warning.

## Recovery plan

1. Back up the Production database before changing its structure.
2. Apply all five `20260916*.sql` files in filename order rather than running the `migrations/` directory itself:

```bash
cd /opt/MIS_Projects/Production/supabase
for f in migrations/20260916*.sql; do
  echo "Applying $f"
  docker exec -i mis_p_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$f" || exit 1
done
```

If the Production database container has a different name, replace `mis_p_db` with its actual name. The loop stops immediately on a real error.

3. Ask the database API to reload its schema cache:

```bash
docker exec -i mis_p_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  -c "NOTIFY pgrst, 'reload schema';"
```

4. Verify all required columns exist on `sap_sync_runs` and `zfisales_detail`, and verify `activate_zfisales_snapshot` exists.
5. Reload the portal and confirm the sync-history request returns HTTP 200.
6. Run one manual Production sync and confirm Received, Stored, Replaced, and Invalid are recorded.
7. Confirm the active sales-row count matches the completed snapshot before restoring the schedule.

## Important follow-up

The middleware shared secret, SAP password, and database service credential were pasted into chat. Rotate all three after recovery and recreate the Production middleware process with the updated values.
