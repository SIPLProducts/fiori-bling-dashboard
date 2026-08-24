# Fix: auth / rest / storage keep restarting on Production

## What the output shows

- `mis_p_db` is up and healthy, `mis_p_meta` is healthy.
- `mis_p_auth`, `mis_p_rest`, `mis_p_storage` are in `Restarting (1)` loops — the same signature as before: the internal database roles (`authenticator`, `supabase_auth_admin`, `supabase_storage_admin`) still have no usable password.
- `mis_p_kong` and `mis_p_studio` never started because the first `up` aborted with "container mis_p_db is unhealthy" (the db just needed more than the initial grace period).
- `curl 127.0.0.1:9010/rest/v1/` returns `000` because Kong was never created in this run.

So the password bootstrap in `supabase/roles.sql` is not taking effect. Running it as an `initdb` script is fragile: the Supabase Postgres image creates several of those roles in its own init phase, so an `ALTER USER` that runs too early either fails or is later overwritten.

## Plan

1. **Stop bootstrapping passwords through `docker-entrypoint-initdb.d`.**
   Remove the `./supabase/roles.sql:/docker-entrypoint-initdb.d/99-roles.sql` mount from `db` in both `deploy/docker/docker-compose.production.yml` and `docker-compose.quality.yml`.

2. **Add a one-shot `roles` service** (same pattern as `migrate`) that waits for the db to be healthy and then applies the passwords over a superuser connection, so it always runs after the image finished creating its roles:
   - image: `supabase/postgres:15.8.1.049`, `restart: "no"`
   - `depends_on: db: {condition: service_healthy}`
   - runs `psql -h db -U postgres` with the `ALTER USER ... WITH PASSWORD` statements from `roles.sql`, guarded so a role that doesn't exist is skipped instead of aborting.
   - `migrate`, `auth`, `rest`, `storage`, `realtime` then depend on `roles` completing successfully.

3. **Make `roles.sql` idempotent and non-fatal** — wrap each `ALTER USER` in a `DO` block that checks `pg_roles` first, and read the password from the `PGPASSWORD`/env value passed to the container rather than a backtick shell expansion.

4. **Give the db a startup grace period** so the first `up` doesn't abort: add `start_period: 30s` to the db healthcheck (retries stay as-is).

5. **Redeploy sequence for you to run** (wipes the Production data volume, which is fine — no real data yet):

   ```bash
   cd /opt/MIS_Projects/Production/backend
   docker compose --env-file .env -f docker-compose.production.yml down -v
   docker compose --env-file .env -f docker-compose.production.yml up -d
   sleep 60
   docker compose --env-file .env -f docker-compose.production.yml ps
   docker logs mis_p_roles --tail 20
   docker logs mis_p_migrate --tail 20
   curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/
   ```

   Expected: `roles` and `migrate` exited 0, all other containers `Up`, and the curl returns `401` (Kong reachable, key required) — not `000`.

6. Repeat the same two file changes for Quality and note the same reset command in `deploy/README.md`.

## Files touched

- `deploy/docker/docker-compose.production.yml`
- `deploy/docker/docker-compose.quality.yml`
- `deploy/docker/supabase/roles.sql`
- `deploy/README.md`

No application code changes.
