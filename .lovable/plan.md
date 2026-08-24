# Fix: Production stack — password authentication failing for every service

## What the latest run tells us

The volumes were wiped and recreated, yet:

- `mis_p_db` is up and healthy, `mis_p_meta` is healthy.
- `mis_p_auth` and `mis_p_storage` restart in a loop; `rest`, `kong`, `studio`, `realtime` were only *created*, never started, because the first `up` aborted on "container mis_p_db is unhealthy" (the db needs longer than the current healthcheck grace period on a cold init).
- `mis_p_migrate` now fails with **`password authentication failed for user "postgres"`**.

That last line is the important change. It is no longer only the internal service roles — even the superuser password does not match. So the password the containers send (`POSTGRES_PASSWORD` from `.env`) is not the password the database was initialised with. Two things can cause that, and we need to see which before changing anything:

1. `POSTGRES_PASSWORD` in `.env` is being read differently than expected (quoting, trailing whitespace, a `#`, or the value was edited after the volume was first created).
2. The `roles.sql` init mount is not a real file on the server (same trap as `kong.yml` earlier — Docker silently creates a *directory* when the file is missing), so the role bootstrap never ran and something in init aborted early.

`mis_p_roles` does not exist yet — that service is part of this plan, not something already deployed.

## Step 1 — Diagnose (you run, paste output)

```bash
cd /opt/MIS_Projects/Production/backend
ls -l supabase/                       # roles.sql and kong.yml must be FILES, not dirs
grep -n '^POSTGRES_PASSWORD' .env | cat -A | head -1   # reveals quotes/trailing spaces
docker exec mis_p_db printenv POSTGRES_PASSWORD
docker logs mis_p_db 2>&1 | grep -iE 'roles|error|fatal|initdb' | tail -30
```

If `supabase/roles.sql` shows as a directory, `rm -rf supabase/roles.sql` and re-upload the real file from the repo before anything else.

## Step 2 — Repo changes (I make these)

1. **Move the role-password bootstrap out of `docker-entrypoint-initdb.d`.**
   Remove the `./supabase/roles.sql:/docker-entrypoint-initdb.d/99-roles.sql` mount from `db` in both `docker-compose.production.yml` and `docker-compose.quality.yml`. A missing/mis-mounted file there can break initialisation itself, which is exactly the failure mode we keep hitting.

2. **Add a one-shot `roles` service** (`mis_p_roles` / `mis_q_roles`), same pattern as `migrate`:
   - waits for `db: service_healthy`, connects as superuser, and applies `ALTER USER ... WITH PASSWORD` for `postgres`, `authenticator`, `pgbouncer`, `supabase_auth_admin`, `supabase_functions_admin`, `supabase_storage_admin`, `supabase_admin`, each guarded by a `pg_roles` existence check so a missing role is skipped instead of aborting.
   - the SQL is passed inline in the compose entrypoint, so there is **no host file to mis-mount**.
   - `migrate`, `auth`, `rest`, `storage`, `realtime` gain `depends_on: roles: {condition: service_completed_successfully}`.

3. **Give the db a real cold-start window**: add `start_period: 60s` to the db healthcheck so the first `up` no longer aborts with "db is unhealthy" and Kong/Studio actually start.

4. Delete `deploy/docker/supabase/roles.sql` and update `deploy/README.md` (file list + the reset procedure below).

## Step 3 — Redeploy

```bash
cd /opt/MIS_Projects/Production/backend
docker compose --env-file .env -f docker-compose.production.yml down -v
docker compose --env-file .env -f docker-compose.production.yml up -d
sleep 90
docker compose --env-file .env -f docker-compose.production.yml ps
docker logs mis_p_roles --tail 30
docker logs mis_p_migrate --tail 30
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/
```

Expected: `roles` and `migrate` exited 0, everything else `Up`, and the curl returns `401` (Kong reachable, API key required) instead of `000`.

Same changes are applied to the Quality compose file so both environments stay identical.

## Files touched

- `deploy/docker/docker-compose.production.yml`
- `deploy/docker/docker-compose.quality.yml`
- `deploy/docker/supabase/roles.sql` (removed)
- `deploy/README.md`

No application code changes.
