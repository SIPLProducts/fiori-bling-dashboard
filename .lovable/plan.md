# Fix Step 2: `type "app_role" already exists` — then finish Quality deployment

The migration loop stopped on the very first file with
`ERROR: type "app_role" already exists`. That enum is a leftover from the
earlier partial run (the first attempt created the enum, then failed on a
later statement, leaving the database half-initialised). Everything else in
the database is still empty, so the fix is: drop the orphaned enum, then
re-run the same loop.

**Nginx answer first: no changes needed for Quality.** The repo's
`deploy/nginx/mis-quality.conf` already proxies `/middleware/` to
`127.0.0.1:3002` on port 8081 — it matches the plan exactly. Leave it as is.

## Step 1 — Confirm the database is otherwise empty

```bash
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select count(*) as public_tables from information_schema.tables where table_schema = 'public';"
```

Expected: `0` (or only Supabase-internal tables — in that case, check none of
them are `zfisales_detail`, `roles`, `profiles`, etc.).

## Step 2 — Drop the orphaned enum

Only after Step 1 confirms no application tables exist:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c "drop type if exists public.app_role cascade;"
```

If it reports that something depends on the type (e.g. a leftover table),
drop that table too — the database has no data yet, so nothing is lost:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select tablename from pg_tables where schemaname = 'public';"
# for any application table listed: drop table public.<name> cascade;
```

## Step 3 — Re-run the full migration loop (unchanged)

```bash
for f in $(ls /opt/MIS_Projects/Quality/supabase/migrations/*.sql | sort); do
  echo "==> $(basename $f)"
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$f" || break
done
```

This time it should run through every file without an error. Verify:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select count(*) from zfisales_detail; select key from roles order by sort_order;"
```

Expected: a row count (0 is fine) from `zfisales_detail` and the role list
(`super_admin`, `viewer`, ...).

## Step 4 — Continue with the approved plan

Then proceed exactly as approved before:
- Step 3 of the plan — link the Sharvi Admin account (profile + super-admin role)
- Step 4 — install and start the middleware on port 3002 with PM2
- Step 5 — verify Quality (login, dashboards, SAP API Settings test)

## Repo changes

None — this is a server-side fix only.
