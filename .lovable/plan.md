# Fix Production database initialization

## Confirmed cause

The latest output confirms the problem:

- `supabase/roles.sql` is a **directory**, not a file. Docker created it automatically because the source file was missing when Compose first ran.
- That directory was mounted where a database initialization SQL file was expected, so the internal service-role passwords were never set. This explains the auth and storage password failures.
- This database image's administrative role is `supabase_admin`; the current migration and healthcheck incorrectly use `postgres`, which the log confirms does not exist.
- The `.env` password itself is present without trailing spaces.

## Changes to make in the repository

1. Restore `deploy/docker/supabase/roles.sql` as a real SQL file using the official internal-role password statements.
2. Mount it at the image's correct init-script location:
   `/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:ro`.
3. Change the database healthcheck and migration connection from `postgres` to `supabase_admin` in both Production and Quality compose files.
4. Add a cold-start grace period to the database healthcheck so the first `up` waits for initialization instead of aborting early.
5. Update the deployment README with a mandatory file check before first startup so Docker cannot silently replace `roles.sql` or `kong.yml` with directories again.

## Server recovery after the corrected files are uploaded

The existing Production volume must be recreated because it was initialized without the required role-password script.

```bash
cd /opt/MIS_Projects/Production/backend

# Stop first, then remove the accidental directory.
docker compose --env-file .env -f docker-compose.production.yml down -v
sudo rm -rf supabase/roles.sql

# Upload the corrected repository files now:
# docker-compose.production.yml
# supabase/roles.sql

# Verify both mounts are regular files. The first character must be "-", not "d".
ls -l supabase/roles.sql supabase/kong.yml

# Start from a clean database volume.
docker compose --env-file .env -f docker-compose.production.yml up -d
sleep 90

# Verify.
docker compose --env-file .env -f docker-compose.production.yml ps
docker logs mis_p_migrate --tail 30
docker logs mis_p_auth --tail 20
docker logs mis_p_rest --tail 20
docker logs mis_p_storage --tail 20
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/
```

Expected result:

- `migrate` exits with code 0 after printing `migrations complete`.
- Auth, REST, Storage, Realtime, Kong, and Studio remain `Up` rather than restarting.
- Port `9010` returns an HTTP response such as `401`, not `000`.

## Files touched

- `deploy/docker/docker-compose.production.yml`
- `deploy/docker/docker-compose.quality.yml`
- `deploy/docker/supabase/roles.sql`
- `deploy/README.md`

No application code changes.