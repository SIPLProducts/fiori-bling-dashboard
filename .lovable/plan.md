# Fix the Quality stack: Kong down + migrations never applied

Your output tells us three concrete things:

| Symptom | Meaning |
| --- | --- |
| `open .../docker-compose.yml: no such file` | The compose file on the server is not named `docker-compose.yml` |
| `curl 127.0.0.1:8000/rest/v1/` → `000` | The API gateway (Kong) container is **not running** |
| `/supabase/rest/v1/` → `502` | Nginx is fine; its upstream (Kong) is dead — same root cause |
| `ls: cannot access '/migrations/*.sql'` | The migration container mounted an **empty** folder — your database has **no tables** |
| `127.0.0.1:8082` → `307` | Studio is up (307 is normal) |

So nothing is broken in the app — the backend was never fully brought up, and the
schema was never created.

## Step 1 — find the real compose file name

```bash
cd /opt/MIS_Projects/Quality/backend
ls -la
```

Use whatever it is called (likely `docker-compose.quality.yml`) in every command
below; I will write `-f docker-compose.quality.yml`.

## Step 2 — get the SQL onto the server

The migrate container mounts `../../supabase/migrations` relative to the compose
file. That path is empty on your server. Fix by uploading the repo's
`supabase/migrations/*.sql` to:

```
/opt/MIS_Projects/Quality/supabase/migrations/
```

(i.e. two levels up from `backend/`, matching the compose mount), then verify:

```bash
ls /opt/MIS_Projects/Quality/supabase/migrations/*.sql
```

If you would rather keep the SQL beside the compose file, tell me and I will
change the mount in `deploy/docker/docker-compose.quality.yml` to
`./migrations:/migrations:ro`.

## Step 3 — bring everything up and re-run migrations

```bash
docker compose --env-file .env -f docker-compose.quality.yml up -d --remove-orphans
docker compose --env-file .env -f docker-compose.quality.yml run --rm migrate
docker compose --env-file .env -f docker-compose.quality.yml ps
```

`ps` must show `mis_q_kong` as **running**. If it exited:

```bash
docker logs mis_q_kong --tail 50
```

The usual cause is a placeholder still left in `.env` — `ANON_KEY` /
`SERVICE_ROLE_KEY` must be real JWTs signed with `JWT_SECRET`, and
`DASHBOARD_PASSWORD` must not be `change-me-…`.

## Step 4 — re-verify

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/        # expect 200/401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/    # expect same
curl -s -o /dev/null -w '%{http_code}\n' -u supabase:YOURPASSWORD http://127.0.0.1/studio/
```

Note the earlier `-u supabase:<studio-pass>` failed only because `<` is shell
redirection — type the literal password, no angle brackets.

## Step 5 — Studio login

Basic-auth file is now created (`htpasswd` succeeded on the third try). Studio
has two gates: the Nginx prompt (`supabase` + the password you just set) and
Kong's `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` from `.env`. Keep them the
same to avoid confusion. Browse to `http://10.10.4.165/studio/` — never
`:8000`, which is loopback-only by design.

## Repo change in this plan

Only if you choose the alternative in Step 2: adjust the `migrate` service
volume in `deploy/docker/docker-compose.quality.yml` (and the production twin)
to mount `./migrations` instead of `../../supabase/migrations`, plus a matching
note in `deploy/README.md`. Otherwise this is server-side only — no code edits.
