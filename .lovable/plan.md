# Apply the Production snapshot-sync migrations

## Confirmed issue

Production is running the new portal and middleware against an older database schema. The Production database container is `mis_p_db`, exposed on host port `5433`. The required upgrade consists of the five `20260916*.sql` files.

Do not run `bash migrations/`; that path is a directory, not a script. Do not rerun every historical migration.

## Safe execution

1. Pause the Production middleware/scheduler so no synchronization runs during the schema upgrade.
2. From `/opt/MIS_Projects/Production/supabase`, apply only these five files in filename order:

```bash
cd /opt/MIS_Projects/Production/supabase

for f in migrations/20260916*.sql; do
  echo "Applying $f"
  docker exec -i mis_p_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$f" || exit 1
done
```

Expected order:

```text
20260916135931_1ccc97f5-937e-43e1-a311-e14f9fdc5c3e.sql
20260916140003_9f06cf17-7c58-4402-96f4-ca529604aab7.sql
20260916140109_aea96a5d-0d9d-4931-89a7-2c08313f43dc.sql
20260916140137_5be07962-36ff-4822-b8d4-e0ecd0c1fd02.sql
20260916140222_d3d131b0-984a-4185-9a8e-d269c744afc9.sql
```

3. Reload the Production data API schema cache:

```bash
docker exec -i mis_p_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  -c "NOTIFY pgrst, 'reload schema';"
```

4. Verify the new history fields and snapshot function:

```bash
docker exec -i mis_p_db psql -U supabase_admin -d postgres -P pager=off -c \
"SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='sap_sync_runs'
 AND column_name IN ('records_stored','records_replaced','records_invalid','sync_scope_key','snapshot_id')
 ORDER BY column_name;

SELECT to_regprocedure('public.activate_zfisales_snapshot(text,uuid,integer)') AS snapshot_function;"
```

The first query should return five rows, and `snapshot_function` must not be blank.

5. Restart the Production middleware, reload the portal, and confirm the sync-history request returns HTTP 200.
6. Before the first snapshot-based reload, clear the old hash-key sales rows once, then run every required Production Sales KPI request and verify each run reports `Received = Stored`:

```bash
docker exec -i mis_p_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  -c "TRUNCATE TABLE public.zfisales_detail;"
```

This final command permanently removes current Production sales rows. Run it only immediately before the complete SAP reload, not merely to fix the HTTP 400.

## Security follow-up

Rotate the Production middleware shared secret, SAP password, and database service credential because they were exposed in chat. Recreate the middleware process with the rotated values.
