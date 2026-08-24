# Production: Kong returns 000 — diagnose before changing anything

The stack came up, but `curl 127.0.0.1:9010/rest/v1/` returning `000` means
nothing is listening on that port — Kong is not running (it either exited or is
crash-looping). Quality showed the same symptom, and there the cause was
`supabase/kong.yml` existing as an empty **directory** instead of a file. That is
the most likely cause here too, but it is unconfirmed for Production, so step 1
is to read the logs rather than assume.

## Step 1 — confirm the cause

```bash
cd /opt/MIS_Projects/Production/backend
docker compose --env-file .env -f docker-compose.production.yml ps
docker logs mis_p_kong --tail 30
file supabase/kong.yml
```

Expected outcomes:

- `kong.yml: ASCII text` and Kong `Up` → different problem; paste the log.
- `kong.yml: directory` → the file was never uploaded; go to Step 2.
- Log mentions an empty consumer key → a blank `ANON_KEY`,
  `SERVICE_ROLE_KEY`, `DASHBOARD_USERNAME` or `DASHBOARD_PASSWORD` in `.env`.

## Step 2 — if `kong.yml` is a directory

```bash
docker compose --env-file .env -f docker-compose.production.yml stop kong
rm -rf supabase/kong.yml
# upload repo file deploy/docker/supabase/kong.yml to
#   /opt/MIS_Projects/Production/backend/supabase/kong.yml
file supabase/kong.yml      # must say: ASCII text
head -3 supabase/kong.yml   # must start with: _format_version: "2.1"
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate kong
sleep 10
docker logs mis_p_kong --tail 20
```

## Step 3 — check the keys are in place

Production `.env` must contain the ANON / SERVICE_ROLE JWTs generated for the
production `JWT_SECRET` (both were produced in the previous step), plus:

```bash
grep -c 'change-me' .env    # must print 0
grep -c '^ANON_KEY=eyJ' .env            # 1
grep -c '^SERVICE_ROLE_KEY=eyJ' .env    # 1
```

If Kong started before these were filled in, recreate it so it picks them up.

## Step 4 — verify the chain

```bash
docker compose --env-file .env -f docker-compose.production.yml ps   # all Up, none Restarting
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/       # 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9012/               # 200/307 Studio
docker logs mis_p_migrate --tail 20     # expect "==> applying" lines, then "migrations complete"
docker logs mis_p_auth --tail 10        # no "fatal"
```

`000` on 9010 after this means Kong is still not up — send the Kong log.

## Note on the migrate container

`mis_p_migrate` is one-shot. Confirm it actually applied SQL; if it printed
`ls: cannot access '/migrations/*.sql'`, the SQL files are not in
`/opt/MIS_Projects/Production/supabase/migrations/` and the database is empty.

No application code changes.
