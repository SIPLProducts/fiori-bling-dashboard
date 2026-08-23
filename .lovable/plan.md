# Quality: where Kong/Studio live, and how to start the stack

Your `.env` now has real keys and correct URLs. Nothing about Kong, Studio, or Postgres ports belongs in `.env` — those are fixed in `docker-compose.yml`, published to `127.0.0.1` only, and reached through Nginx.

## Where each port is defined (Quality)

| Service | Container | Published on | Reached from a browser |
| --- | --- | --- | --- |
| App (SSR) | `mis_q_app` | `127.0.0.1:8081` | `http://10.10.4.165/` |
| Supabase API gateway (Kong) | `mis_q_kong` | `127.0.0.1:8000` | `http://10.10.4.165/supabase/` |
| Supabase Studio (dashboard) | `mis_q_studio` | `127.0.0.1:8082` | `http://10.10.4.165/studio/` |
| PostgreSQL | `mis_q_db` | `127.0.0.1:5432` | psql only, not public |
| Auth / REST / Realtime / Storage / Meta | internal | not published | only through Kong |

Production is the same list with 9000 / 9010 / 9012 / 5433.

Studio has **no username or password** in self-hosted Supabase. It connects to the database through the `meta` service using `POSTGRES_PASSWORD`. Database login is `postgres` / your `POSTGRES_PASSWORD` on `127.0.0.1:5432`.

## Changes to make in the repo

1. **Protect Studio** — add HTTP basic auth to the `/studio/` block in `deploy/nginx/mis-quality.conf` and `mis-production.conf` (with the optional IP allow-list kept as a comment), since Studio itself has no login.
2. **Bare-IP access** — add a note/comment in both configs that `server_name` must be `_` when serving on `10.10.4.165` instead of a hostname.
3. **README** — new "Ports, Kong and Studio" section with the table above, the Studio password-file steps (`htpasswd`), the database connection details, and the exact start/verify commands below.

## Commands to run Quality on the server

```bash
# 1. Make sure the files are in place
ls /opt/MIS_Projects/Quality/backend        # .env  Dockerfile  docker-compose.yml  supabase/kong.yml
ls /opt/MIS_Projects/Quality/frontend/dist  # uploaded build output
ls /opt/MIS_Projects/Quality/supabase/migrations

# 2. Start the whole stack (db, migrations, auth, rest, realtime, storage, meta, kong, studio, app)
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env -f docker-compose.yml up -d --build

# 3. Watch it come up
docker compose ps
docker logs -f mis_q_migrate     # migrations applied once, then exits
docker compose logs -f app

# 4. Verify locally
curl -I http://127.0.0.1:8081/                  # app
curl -I http://127.0.0.1:8000/rest/v1/          # Kong
curl -I http://127.0.0.1:8082/                  # Studio

# 5. Enable Nginx
sudo cp /path/to/deploy/nginx/mis-quality.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/mis-quality.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Open in a browser
#    App    http://10.10.4.165/
#    Studio http://10.10.4.165/studio/
```

Restart after uploading a new `dist/`:

```bash
cd /opt/MIS_Projects/Quality/backend && docker compose restart app
```
