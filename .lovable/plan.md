# Kong is fixed — next: confirm auth / rest / storage stay up

Kong loaded `kong.yml` successfully (`declarative config loaded`), so the
`basic-auth` plugin fix worked. The `curl` result was cut off in your paste, and
`rest`, `auth` and `storage` were all restarting before this, so the next step
is to confirm whether they are now healthy or still crash-looping.

## Step 1 — status and logs

```bash
cd /opt/MIS_Projects/Production/backend
docker compose --env-file .env -f docker-compose.production.yml ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/
docker logs mis_p_rest --tail 20
docker logs mis_p_auth --tail 20
docker logs mis_p_storage --tail 20
docker logs mis_p_migrate --tail 20
```

What each result means:

- `9010/rest/v1/` returns `200` or `401` → the API gateway chain works.
- `9010` returns `502` → Kong is up but `rest` is down; read the `rest` log.
- `ps` shows `Restarting` for auth/rest/storage → go to Step 2.

## Step 2 — if the logs say `password authentication failed`

The Postgres volume was initialised with a different `POSTGRES_PASSWORD` than
the one currently in `.env`. Production has no real data yet, so reset cleanly:

```bash
docker compose --env-file .env -f docker-compose.production.yml down -v
docker compose --env-file .env -f docker-compose.production.yml up -d
sleep 30
docker compose --env-file .env -f docker-compose.production.yml ps
docker logs mis_p_migrate --tail 30
```

`down -v` deletes the database volume — safe only because this environment is
brand new. After this, `POSTGRES_PASSWORD` must never be changed again.

## Step 3 — if `mis_p_migrate` found no SQL

`ls: cannot access '/migrations/*.sql'` means the migration files are missing
from `/opt/MIS_Projects/Production/supabase/migrations/`. Copy the repo's
`supabase/migrations/*.sql` there, then:

```bash
docker compose --env-file .env -f docker-compose.production.yml run --rm migrate
```

Expect one `==> applying` line per file, then `migrations complete`.

## Step 4 — end-to-end check through Nginx

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/   # 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/studio/             # 401 until you send basic-auth creds
```

Then open `http://mis.siplproducts.com/` for the portal and `/studio/` for the
dashboard (user `supabase`, password from `DASHBOARD_PASSWORD`). Sign in with
the demo account seeded by the migrations, or create the first user — the first
user is granted the admin role automatically.

Paste the Step 1 output and I will tell you which branch applies.

No application code changes.
