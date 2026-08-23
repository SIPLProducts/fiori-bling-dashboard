# Fix the Quality stack: migrations mount + Kong down

Your `ls` confirms the layout, and it explains the failures:

```text
/opt/MIS_Projects/Quality/backend/
  docker-compose.quality.yml
  .env
  supabase/            <- only kong.yml lives here today
```

| Symptom | Cause |
| --- | --- |
| `no such file: docker-compose.yml` | File is named `docker-compose.quality.yml` |
| `ls: cannot access '/migrations/*.sql'` | Compose mounts `../../supabase/migrations`, which resolves to `/opt/MIS_Projects/supabase/migrations` — a folder that does not exist on your server. **Your database has no tables.** |
| `127.0.0.1:8000` → `000`, `/supabase/` → `502` | Kong container is not running (Nginx itself is fine) |
| `127.0.0.1:8082` → `307` | Studio is up — that is normal |

## Repo change I will make

Change the `migrate` service volume in both
`deploy/docker/docker-compose.quality.yml` and
`deploy/docker/docker-compose.production.yml`:

```yaml
    volumes:
      - ./supabase/migrations:/migrations:ro
```

so the SQL sits next to the compose file, beside `supabase/kong.yml` — matching
the folder you already have. `deploy/README.md` gets the matching upload step.

## Steps on the server

**1. Upload the SQL.** Copy every file from the repo's `supabase/migrations/`
into:

```
/opt/MIS_Projects/Quality/backend/supabase/migrations/
```

Then re-upload the updated `docker-compose.quality.yml`. Verify:

```bash
ls /opt/MIS_Projects/Quality/backend/supabase/migrations/*.sql
```

**2. Bring the stack up and apply migrations.**

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env -f docker-compose.quality.yml up -d --remove-orphans
docker compose --env-file .env -f docker-compose.quality.yml run --rm migrate
docker compose --env-file .env -f docker-compose.quality.yml ps
```

`ps` must show `mis_q_kong` running. If it exited:

```bash
docker logs mis_q_kong --tail 50
```

Kong almost always dies because `.env` still has placeholders — `ANON_KEY` and
`SERVICE_ROLE_KEY` must be real JWTs signed with your `JWT_SECRET`, and
`DASHBOARD_PASSWORD` must not be `change-me-…`.

**3. Verify.**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/       # expect 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/   # same
curl -s -o /dev/null -w '%{http_code}\n' -u supabase:YOURPASSWORD http://127.0.0.1/studio/
```

Earlier the studio curl failed only because `<studio-pass>` was read by bash as
a file redirect — type the literal password without angle brackets.

**4. Open Studio** at `http://10.10.4.165/studio/`. Never `:8000` — Kong is
bound to loopback on purpose, which is exactly what your screenshot showed.

## Files changed

- `deploy/docker/docker-compose.quality.yml` — migrate volume path
- `deploy/docker/docker-compose.production.yml` — same
- `deploy/README.md` — upload the migrations folder alongside the compose file
