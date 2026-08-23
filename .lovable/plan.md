# Two exact causes found in the logs

## 1. Kong: `kong.yml: Is a directory`

The file `/opt/MIS_Projects/Quality/backend/supabase/kong.yml` does not exist.
When a bind-mount source is missing, Docker silently creates an empty
**directory** with that name — Kong then tries to parse a directory and dies.
That is the whole reason `:8000` times out and `/supabase/` returns 502.

## 2. Auth + REST: wrong database password

```
password authentication failed for user "authenticator"
password authentication failed for user "supabase_auth_admin"
```

The Postgres volume `q_db_data` was initialised with an **earlier**
`POSTGRES_PASSWORD`. Changing `.env` afterwards does not change the passwords
already stored in the volume, so every service now presents the wrong one.
Since the Quality database is empty (migrations never ran), the clean fix is to
wipe the volume and let it initialise with the current password.

## Fix — run in this order

**Step A — put the real kong.yml in place.**

```bash
cd /opt/MIS_Projects/Quality/backend
ls -la supabase/            # you will see kong.yml listed as a DIRECTORY
rmdir supabase/kong.yml     # remove the empty folder Docker created
```

Now upload the repo file `deploy/docker/supabase/kong.yml` to
`/opt/MIS_Projects/Quality/backend/supabase/kong.yml` and confirm it is a file:

```bash
file supabase/kong.yml      # must say "ASCII text", not "directory"
head -3 supabase/kong.yml   # must start with _format_version: "2.1"
```

**Step B — check `.env` is final before wiping.** Confirm `POSTGRES_PASSWORD`,
`JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_USERNAME`,
`DASHBOARD_PASSWORD` all hold real values with no `change-me`:

```bash
grep -c 'change-me' .env    # must print 0
```

`ANON_KEY` and `SERVICE_ROLE_KEY` must be JWTs signed with this exact
`JWT_SECRET` — if you regenerate `JWT_SECRET` you must regenerate both keys.

**Step C — recreate the stack from scratch.**

```bash
docker compose --env-file .env -f docker-compose.quality.yml down -v
docker compose --env-file .env -f docker-compose.quality.yml up -d
sleep 30
docker compose --env-file .env -f docker-compose.quality.yml ps
```

`down -v` deletes `q_db_data` and `q_storage_data`. Safe here — the Quality
database has no tables yet. Every container should now read **Up**, with no
`Restarting`.

**Step D — apply the migrations** (the mount path is fixed in the compose file
you are about to upload, so re-upload `docker-compose.quality.yml` too if you
have not):

```bash
docker compose --env-file .env -f docker-compose.quality.yml run --rm migrate
```

Expect seven `==> applying /migrations/20260808….sql` lines.

**Step E — verify.**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/      # 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/  # same
docker logs mis_q_auth --tail 5                                              # no "fatal"
```

Then open `http://10.10.4.165/studio/` (basic-auth user `supabase`). Not
`:8000` — that port is loopback-only by design.

## Repo change

Add a pre-flight section to `deploy/README.md`:

- The `supabase/kong.yml` bind mount must be a **file** before the first
  `up -d`; if it is missing Docker creates a directory and Kong crash-loops with
  `kong.yml: Is a directory`.
- Do not change `POSTGRES_PASSWORD` after the first start; a mismatch shows as
  `password authentication failed for user "authenticator"` and requires
  `down -v` to reset.
- A short "check before first start" checklist covering both, plus the
  migrations folder path.

No application code changes.
