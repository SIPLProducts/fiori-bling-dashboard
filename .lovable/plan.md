# Fix Production database initialization (and protect Quality)

## Why Quality works and Production does not

Quality's database volume was initialized **before** the `roles.sql` mount was ever added, so its containers still run from that earlier, working initialization. Nothing on Quality has been re-created since — that is the only reason it is fine.

Production, in contrast, was started fresh **with** the new mount, and the FileZilla view confirms the cause: `supabase/roles.sql` was never uploaded to the server, so Docker created it as an empty **directory** and mounted that where an initialization SQL file was expected. As a result:

- the internal service roles never got a password → auth and storage fail with password authentication errors,
- the migration step connects as `postgres`, a role this database image does not create (its admin role is `supabase_admin`) → `role "postgres" does not exist`,
- Kong and Studio never start because the first `up` aborts while the database is still initializing.

Important: Quality carries the exact same mount line. The next time Quality is re-created without that file present, it will fail in precisely the same way.

## Repository changes

1. Keep `deploy/docker/supabase/roles.sql` as a real SQL file with the official internal-role password statements, and mount it at the image's correct location: `/docker-entrypoint-initdb.d/init-scripts/99-roles.sql`.
2. Change the database healthcheck and the migration step to connect as `supabase_admin` instead of `postgres`, in both Production and Quality compose files.
3. Add a cold-start grace period to the database healthcheck so the first `up` no longer aborts with "db is unhealthy".
4. Update `deploy/README.md` with a mandatory pre-start file check (`ls -l supabase/`) so a missing file can never silently become a directory again, plus a clear note that Quality must not be re-created until the corrected files are uploaded there too.

## Server steps — Production only

```bash
cd /opt/MIS_Projects/Production/backend
docker compose --env-file .env -f docker-compose.production.yml down -v
sudo rm -rf supabase/roles.sql

# Upload from the repo: docker-compose.production.yml and supabase/roles.sql

ls -l supabase/            # both entries must start with "-", not "d"

docker compose --env-file .env -f docker-compose.production.yml up -d
sleep 90
docker compose --env-file .env -f docker-compose.production.yml ps
docker logs mis_p_migrate --tail 30
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/
```

Expected: `migrate` exits 0 with `migrations complete`, all other containers stay `Up`, and the curl returns `401` instead of `000`.

## Quality — no redeploy now

Leave Quality running as-is. Only upload the corrected `docker-compose.quality.yml` and `supabase/roles.sql` so they are in place for whenever Quality is next rebuilt. Do not run `down -v` on Quality.

## Files touched

- `deploy/docker/docker-compose.production.yml`
- `deploy/docker/docker-compose.quality.yml`
- `deploy/docker/supabase/roles.sql`
- `deploy/README.md`

No application code changes.
