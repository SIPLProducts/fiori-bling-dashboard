# Root cause: Supabase's internal DB roles never got a password

The log is conclusive:

```
password authentication failed for user "supabase_storage_admin"  (code 28P01)
```

`POSTGRES_PASSWORD` only sets the password for the `postgres` superuser. The
Supabase image also ships internal roles — `authenticator`, `supabase_auth_admin`,
`supabase_storage_admin`, `supabase_admin`, `pgbouncer` — and those are created
**without** a password. Our compose file points `rest`, `auth` and `storage` at
those roles with `${POSTGRES_PASSWORD}`, so every one of them fails to log in and
crash-loops. This is a gap in our deploy files, not something wrong on your
server, and it explains all three restarting containers (and, indirectly, the
`Connection refused` the migrate container hit while Postgres was busy).

## Repo change

**1. New file `deploy/docker/supabase/roles.sql`** — the standard Supabase
self-hosting init script that assigns `POSTGRES_PASSWORD` to every internal role:

```sql
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator            WITH PASSWORD :'pgpass';
ALTER USER pgbouncer                WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin      WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin   WITH PASSWORD :'pgpass';
ALTER USER supabase_admin           WITH PASSWORD :'pgpass';
```

**2. Mount it into the `db` service** in both
`docker-compose.production.yml` and `docker-compose.quality.yml`:

```yaml
    volumes:
      - p_db_data:/var/lib/postgresql/data
      - ./supabase/roles.sql:/docker-entrypoint-initdb.d/99-roles.sql:ro
```

(Quality uses `q_db_data`.) Scripts in `/docker-entrypoint-initdb.d` run **only
on first initialisation of an empty data volume**, which is why the environment
must be recreated with `down -v`.

**3. `deploy/README.md`** — add `supabase/roles.sql` to the required-files list
next to `kong.yml`, and note that changing `POSTGRES_PASSWORD` after first start
requires `down -v`.

## On the server (Production — no data yet, safe to wipe)

```bash
cd /opt/MIS_Projects/Production/backend
# upload the updated docker-compose.production.yml AND the new supabase/roles.sql
ls -l supabase/            # must show kong.yml AND roles.sql as FILES, not directories

docker compose --env-file .env -f docker-compose.production.yml down -v
docker compose --env-file .env -f docker-compose.production.yml up -d
sleep 40
docker compose --env-file .env -f docker-compose.production.yml ps
```

Expect `db`, `auth`, `rest`, `storage`, `realtime`, `meta`, `kong`, `studio` all
`Up` and none `Restarting`.

```bash
docker logs mis_p_migrate --tail 30   # "==> applying" per file, then "migrations complete"
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/    # 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/
```

If `migrate` shows `Connection refused` again, rerun it once — it is one-shot and
harmless to repeat:

```bash
docker compose --env-file .env -f docker-compose.production.yml run --rm migrate
```

## Quality environment

Quality has the same defect. Apply the same fix there whenever you next rebuild
it — but only with `down -v` if you are willing to lose its database, since that
one already has data.

No application code changes.
