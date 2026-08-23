# Remaining blocker: Kong's `kong.yml` is a directory

Good progress — migrations applied cleanly (all 7 files, tables + seed rows
created), so the database and its password are now correct.

The only thing still broken is Kong, and its log named the cause exactly:

```
error parsing declarative config file /home/kong/kong.yml:
/home/kong/kong.yml: Is a directory
```

`/opt/MIS_Projects/Quality/backend/supabase/kong.yml` does not exist as a file.
When a bind-mount source is missing, Docker creates an empty **directory** with
that name; Kong tries to parse it and crash-loops. That is why
`127.0.0.1:8000` gives `000` and Nginx `/supabase/` gives `502` — nothing is
listening behind them.

## Fix

**Step 1 — remove the fake directory.**

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env -f docker-compose.quality.yml stop kong
ls -la supabase/            # kong.yml shows as a directory
rmdir supabase/kong.yml
```

If `rmdir` complains the directory is not empty, use
`rm -rf supabase/kong.yml`.

**Step 2 — upload the real file.** Copy the repo file
`deploy/docker/supabase/kong.yml` to
`/opt/MIS_Projects/Quality/backend/supabase/kong.yml`, then confirm:

```bash
file supabase/kong.yml      # "ASCII text" — must NOT say "directory"
head -3 supabase/kong.yml   # starts with: _format_version: "2.1"
```

**Step 3 — recreate Kong only.**

```bash
docker compose --env-file .env -f docker-compose.quality.yml up -d --force-recreate kong
sleep 10
docker logs mis_q_kong --tail 20
```

No `init_by_lua error` should appear. If Kong still exits, the next likely
message is about an empty consumer key — that means `ANON_KEY`,
`SERVICE_ROLE_KEY`, `DASHBOARD_USERNAME` or `DASHBOARD_PASSWORD` is blank in
`.env` (`grep -c 'change-me' .env` must print 0).

**Step 4 — verify the whole chain.**

```bash
docker compose --env-file .env -f docker-compose.quality.yml ps        # all Up, none Restarting
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/       # 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/   # same
docker logs mis_q_auth --tail 5                                        # no "fatal"
```

**Step 5 — open the portal.** `http://10.10.4.165/` for the app,
`http://10.10.4.165/studio/` for Studio (basic-auth user `supabase`). Sign in
with the demo account seeded by the migrations, or create your first user —
the first user is granted the admin role automatically.

## Repo change

Add a pre-flight checklist to `deploy/README.md` so this cannot recur:

- Copy `supabase/kong.yml` into `backend/supabase/` **before** the first
  `up -d`; a missing file becomes a directory and Kong fails with
  `kong.yml: Is a directory`.
- Never change `POSTGRES_PASSWORD` after the first start — the volume keeps the
  original; a mismatch shows as `password authentication failed for user
  "authenticator"` and needs `down -v`.
- Confirm the migrations folder resolves to `Quality/supabase/migrations`
  (already fixed in the compose file).

No application code changes.
