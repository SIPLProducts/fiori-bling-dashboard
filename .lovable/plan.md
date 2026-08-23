# Fix Quality: wrong migrations path, stale compose, restarting services

Now we can see exactly what is wrong.

**1. The SQL is one level up from where compose looks.**
Your files are in `/opt/MIS_Projects/Quality/supabase/migrations/` (7 `.sql`
files). The compose mount `../../supabase/migrations` resolves to
`/opt/MIS_Projects/supabase/migrations` — one directory too high, so the
container sees an empty folder. **Your database still has no tables.**

**2. The compose file on the server is the old one** — it still starts
`mis_q_app`, which is why port 8081 clashes with Nginx. The updated file has no
frontend container.

**3. `auth`, `rest` and `kong` are all in `Restarting (1)`.** That is what makes
`:8000` time out and `/supabase/` return 502. Three services failing together
almost always means bad values in `.env` (JWT secret / keys) — we read their
logs to confirm.

## Repo change

In `deploy/docker/docker-compose.quality.yml` and
`deploy/docker/docker-compose.production.yml`, fix the migrate volume:

```yaml
    volumes:
      - ../supabase/migrations:/migrations:ro
```

matching your actual `Quality/supabase/migrations` layout, and note the expected
folder structure in `deploy/README.md`.

## Steps on the server

**Step 1 — replace the compose file.** Upload the updated
`deploy/docker/docker-compose.quality.yml` over
`/opt/MIS_Projects/Quality/backend/docker-compose.quality.yml`, then:

```bash
cd /opt/MIS_Projects/Quality/backend
docker rm -f mis_q_app
docker compose --env-file .env -f docker-compose.quality.yml up -d --remove-orphans
```

No more 8081 clash — Nginx keeps that port and serves `frontend/dist`.

**Step 2 — read why auth/rest/kong die.**

```bash
docker logs mis_q_rest --tail 30
docker logs mis_q_auth --tail 30
docker logs mis_q_kong --tail 30
```

Expected findings and their fixes:

| Log line | Fix in `.env` |
| --- | --- |
| `JWT secret ... too short` / `Expected 3 parts in JWT` | `ANON_KEY` / `SERVICE_ROLE_KEY` must be real JWTs signed with `JWT_SECRET` (HS256), not placeholders |
| `password authentication failed for user "authenticator"` | `POSTGRES_PASSWORD` in `.env` differs from the password the DB volume was created with — recreate the volume (see Step 4) or reset the role |
| Kong `failed to parse declarative config` / empty key | `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` or the key vars are still `change-me-…` |

Paste the log output back to me and I will pin the exact cause.

**Step 3 — apply the migrations** (after the mount fix is uploaded):

```bash
docker compose --env-file .env -f docker-compose.quality.yml run --rm migrate
```

You should see `==> applying /migrations/20260808090228_….sql` seven times — not
`ls: cannot access`.

**Step 4 — only if the DB password mismatched.** The volume keeps the original
password, so a changed `POSTGRES_PASSWORD` breaks `rest`/`auth`. Wipe and
rebuild (destroys Quality data, which is empty anyway):

```bash
docker compose --env-file .env -f docker-compose.quality.yml down -v
docker compose --env-file .env -f docker-compose.quality.yml up -d
docker compose --env-file .env -f docker-compose.quality.yml run --rm migrate
```

**Step 5 — verify.**

```bash
docker compose --env-file .env -f docker-compose.quality.yml ps   # all Up
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/
```

Then open Studio at `http://10.10.4.165/studio/` — not `:8000`, which is
loopback-only by design and is what your screenshot hit.

## Files changed

- `deploy/docker/docker-compose.quality.yml` — migrate volume `../supabase/migrations`
- `deploy/docker/docker-compose.production.yml` — same
- `deploy/README.md` — document the expected server folder layout
