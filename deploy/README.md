# MIS Portal — Deployment folder

Everything needed to run the MIS portal on your own Ubuntu server, in two fully
isolated stacks: **Quality** and **Production**.

This README assumes you keep the existing server layout:

```text
/opt/MIS_Projects/
├── nginx/
├── Quality/
│   ├── frontend/
│   │   └── dist/          # built app files (uploaded from VS Code)
│   ├── backend/           # docker-compose + Dockerfile + .env
│   ├── middleware/        # only if you have a middleware service
│   └── supabase/
│       ├── kong.yml
│       └── migrations/
└── Production/
    ├── frontend/
    │   └── dist/
    ├── backend/
    ├── middleware/
    └── supabase/
```

**Three paths the compose file depends on — get these exactly right:**

| Compose mount | Must exist on the server |
| --- | --- |
| `../supabase/migrations` | `/opt/MIS_Projects/Quality/supabase/migrations/*.sql` |
| `./supabase/kong.yml` | `/opt/MIS_Projects/Quality/backend/supabase/kong.yml` |
| `./supabase/roles.sql` | `/opt/MIS_Projects/Quality/backend/supabase/roles.sql` |

(Same shape under `Production/`.) If `docker logs mis_q_migrate` prints
`ls: cannot access '/migrations/*.sql'`, the SQL files are not in the folder
above and **no tables were created**.

Upload `kong.yml` and `roles.sql` **before** the first `up -d`. When a bind-mount
source is missing, Docker creates an empty *directory* with that name: Kong then
fails with `kong.yml: Is a directory`, and the roles script silently does nothing
(auth/rest/storage then crash-loop with `password authentication failed`).

**Mandatory pre-start check** — every entry must start with `-`, never `d`:

```bash
ls -l supabase/
# -rw-rw-r-- ... kong.yml
# -rw-rw-r-- ... roles.sql
```

If either shows as a directory: stop the stack, `sudo rm -rf supabase/<name>`,
upload the real file, then start again.

`roles.sql` is mounted at `/docker-entrypoint-initdb.d/init-scripts/99-roles.sql`
so it runs after the image creates its internal roles, and only on first
initialisation of an empty database volume. It gives `authenticator`,
`supabase_auth_admin`, `supabase_storage_admin` and the other internal roles the
`POSTGRES_PASSWORD`.

The database image's superuser is `supabase_admin`, **not** `postgres` — the
healthcheck and the migration step both connect as `supabase_admin`. A
`role "postgres" does not exist` error means an older compose file is still on
the server.

**Never change `POSTGRES_PASSWORD` after the first start.** The volume keeps the
original; a mismatch shows the same authentication failure and can only be fixed
with `docker compose ... down -v`, which deletes the database.

> **Quality is currently running on an older initialisation and is healthy.**
> Upload the corrected `docker-compose.quality.yml` and `supabase/roles.sql` so
> they are in place for the next rebuild, but do **not** run `down -v` on
> Quality — that would wipe its working database.




```
deploy/
  README.md
  nginx/
    mis-quality.conf              HTTP-only reverse proxy for Quality
    mis-production.conf           HTTP-only reverse proxy for Production
  docker/
    .dockerignore
    docker-compose.quality.yml    copy to Quality/backend/docker-compose.yml
    docker-compose.production.yml copy to Production/backend/docker-compose.yml
    .env.quality.example          copy to Quality/backend/.env
    .env.production.example        copy to Production/backend/.env
    supabase/kong.yml             Supabase API gateway routes
```

The portal is a **static SPA** — Nginx serves `frontend/dist/index.html` and the
hashed assets directly. There is no Node app container and no Dockerfile for the
frontend.

## Port matrix

| Component        | Quality | Production |
| ---------------- | ------- | ---------- |
| Frontend         | static files served by Nginx on port 80 | same |
| Middleware       | 3002    | 3010       |
| Backend          | 5000    | 5001       |
| Supabase Kong    | 8000    | 9010       |
| Supabase Studio  | 8082    | 9012       |
| PostgreSQL       | 5432    | 5433       |

All container ports are published to `127.0.0.1` only — Nginx is the single
public entry point.

## Enable automatic scheduled sync on self-hosted

The hosted (Lovable) deployment uses a database timer. A self-hosted static SPA
has no always-running app server, so the SAP middleware service (which already
runs 24/7 under PM2) now hosts its own scheduler.

Prerequisites:

1. The middleware `.env` must contain the local database API URL and the
   **server-only** service role key:

   ```text
   SUPABASE_URL=http://127.0.0.1:8000
   SUPABASE_SERVICE_ROLE_KEY=<Quality service role key>
   ```

2. The SAP endpoint in the portal must have **Enable scheduled sync** on and a
   valid cron expression (e.g. `*/5 * * * *`).

Run the helper script on the server:

```bash
cd /opt/MIS_Projects/Quality/deploy
chmod +x enable-scheduler.sh
./enable-scheduler.sh
```

For Production:

```bash
cd /opt/MIS_Projects/Production/deploy
ENV=production MIDDLEWARE_DIR=/opt/MIS_Projects/Production/middleware \
  PM2_NAME=mis-p-middleware PORT=3010 ./enable-scheduler.sh
```

The script installs dependencies, builds the shared sync bundle, restarts PM2,
and prints a `curl` command you can use to force an immediate test run.

## 1. Build the frontend locally


In VS Code / your local repo:

```bash
npm install
npm run build:static
```

> Use `build:static` for this on-prem Nginx deployment — it flattens the output
> and drops the server bundle. Plain `npm run build` keeps the server bundle and
> is what the hosted (Lovable) deployment uses.
>
> **SAP middleware bridge.** Because the static build has no app server, a POST
> to `/_serverFn/...` returns `405 Not Allowed` from Nginx. The static bundle
> therefore calls the middleware through a same-origin bridge instead, so both
> Nginx configs must contain:
>
> ```nginx
> location /sap-mw/ {
>     proxy_pass http://mis_q_middleware/;          # mis_p_middleware in Production
>     proxy_set_header x-shared-secret "<MIDDLEWARE_SHARED_SECRET>";
>     proxy_read_timeout 600s;
>     proxy_send_timeout 600s;
> }
> ```
>
> Nginx injects the shared secret, so it never reaches the browser. The value
> must match `MIDDLEWARE_SHARED_SECRET` in `middleware/.env`, and the middleware
> `PORT` must match the upstream (Quality 3002, Production 3010).
>
> With the bridge in place, Test connection, middleware health/logs, SAP ping and
> the endpoint Test/sync all work on the static build. The unattended scheduler
> on self-hosted deployments is handled by the middleware itself (see
> "Enable automatic scheduled sync on self-hosted" below).


This creates `dist/` in the repo root containing `index.html`, `assets/`,
`favicon.png` and `robots.txt`. Upload the **contents** of `dist/` to the server
via WinSCP:

- Copy `dist/*` → `/opt/MIS_Projects/Quality/frontend/dist/`
- Copy `dist/*` → `/opt/MIS_Projects/Production/frontend/dist/`


> `VITE_*` values are inlined into the browser bundle at build time, so build
> once per environment if the Supabase URLs/keys differ. If Quality and
> Production share the same self-hosted Supabase, one build is enough.

## 2. Environment files

On the server:

```bash
cd /opt/MIS_Projects/Quality/backend
cp deploy/docker/.env.quality.example .env

cd /opt/MIS_Projects/Production/backend
cp deploy/docker/.env.production.example .env
```

Fill in the secrets (generation commands are inside each file). Quality and
Production must use **different** `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`
and `SERVICE_ROLE_KEY`.

## 3. Copy Docker and Supabase files

```bash
# Quality
cp deploy/docker/docker-compose.quality.yml   /opt/MIS_Projects/Quality/backend/docker-compose.yml
cp deploy/docker/supabase/kong.yml              /opt/MIS_Projects/Quality/supabase/kong.yml
cp -r supabase/migrations/*                     /opt/MIS_Projects/Quality/supabase/migrations/

# Production
cp deploy/docker/docker-compose.production.yml /opt/MIS_Projects/Production/backend/docker-compose.yml
cp deploy/docker/supabase/kong.yml              /opt/MIS_Projects/Production/supabase/kong.yml
cp -r supabase/migrations/*                     /opt/MIS_Projects/Production/supabase/migrations/
```

## 4. Start the stacks

```bash
# Quality
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env -f docker-compose.yml up -d

# Production
cd /opt/MIS_Projects/Production/backend
docker compose --env-file .env -f docker-compose.yml up -d
```

Database migrations run automatically: the one-shot `migrate` service applies
every file in `supabase/migrations/*.sql` in filename order once Postgres is
healthy. There are no edge functions in this project.

Check status and logs:

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose ps
docker logs mis_q_migrate               # migration output
curl -I http://127.0.0.1:8000/          # Supabase Kong (Quality)
curl -I http://127.0.0.1:9010/          # Supabase Kong (Production)
```

## 5. Nginx

The configs are **plain HTTP (port 80) only** — no `listen 443`, no
`ssl_certificate`, no Certbot, no HTTPS redirect. TLS is terminated on your
existing upstream load balancer / reverse proxy.

Nginx serves the SPA straight from `frontend/dist/` with a `try_files` fallback
to `index.html`, so deep links such as `/launchpad` work on refresh.

```bash
sudo cp deploy/nginx/mis-quality.conf    /etc/nginx/sites-available/
sudo cp deploy/nginx/mis-production.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/mis-quality.conf    /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/mis-production.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Routes exposed by each server block:

| Path           | Quality target   | Production target   |
| -------------- | ---------------- | ------------------- |
| `/`            | frontend/dist    | frontend/dist       |
| `/assets/*`    | frontend/dist    | frontend/dist       |
| `/middleware/` | 3002             | 3010                |
| `/backend/`    | 5000             | 5001                |
| `/supabase/`   | 8000 (Kong)      | 9010 (Kong)         |
| `/studio/`     | 8082             | 9012                |
| `/healthz`     | Nginx            | Nginx               |

If you serve by IP instead of a hostname, swap `server_name` for the commented
`server_name _;` line in the config.

Nothing listens on 8081 / 9000 any more — if Nginx already has a
`listen 8081;` or `listen 9000;` block from an earlier setup, remove it.

## 6. Redeploy after a code change

Only the static files change — no container restart is needed.

```bash
# locally
npm run build:static

# upload new dist/* contents to /opt/MIS_Projects/Production/frontend/dist/
# (replace the folder contents, then hard-refresh the browser)
```

The database and its volume are untouched.

## 7. Backup / restore

```bash
# Backup (Production)
docker exec mis_p_db pg_dump -U postgres postgres | gzip > mis-prod-$(date +%F).sql.gz

# Restore
gunzip -c mis-prod-2026-08-23.sql.gz | docker exec -i mis_p_db psql -U postgres -d postgres
```

## 8. Supabase Studio (dashboard) credentials

Self-hosted Studio has **no login of its own**. Access is protected in two
layers by this deployment:

1. **Kong basic auth** — set in each environment's `.env`:

   ```bash
   DASHBOARD_USERNAME=supabase
   DASHBOARD_PASSWORD=$(openssl rand -hex 12)
   ```

   Kong reads these into the `DASHBOARD` consumer defined in
   `supabase/kong.yml`. Change the values and restart Kong to rotate:

   ```bash
   cd /opt/MIS_Projects/Quality/backend
   docker compose --env-file .env up -d --force-recreate kong
   ```

2. **Nginx basic auth on `/studio/`** — create the password file once per
   server:

   ```bash
   sudo apt update && sudo apt install -y apache2-utils
   sudo htpasswd -c /etc/nginx/.mis-studio supabase   # prompts for password
   sudo nginx -t && sudo systemctl reload nginx
   ```

Studio URLs: Quality `http://<host>/studio/` (container `127.0.0.1:8082`),
Production `http://<host>/studio/` (container `127.0.0.1:9012`).

### Database credentials

There is no separate DB user/password setting — the stack uses:

| Item     | Quality           | Production        |
| -------- | ----------------- | ----------------- |
| Host     | `127.0.0.1:5432`  | `127.0.0.1:5433`  |
| Database | `postgres`        | `postgres`        |
| User     | `postgres`        | `postgres`        |
| Password | `POSTGRES_PASSWORD` from `.env` | `POSTGRES_PASSWORD` from `.env` |

```bash
docker exec -it mis_q_db psql -U postgres -d postgres   # Quality
docker exec -it mis_p_db psql -U postgres -d postgres   # Production
```

## Bringing users, SAP settings and sales data to a fresh environment

Run these after every migration in `supabase/migrations/` has been applied.

1. **Users** — `bash deploy/create-users.sh` recreates the five portal accounts
   (profiles + role assignments) with temporary password `Welcome@2026`.
   Production: `SUPABASE_API=http://10.10.4.165:9000/supabase DB_CONTAINER=mis_p_db bash create-users.sh`

2. **SAP configuration** — `deploy/quality-sap-seed.sql` holds the SAP system
   (`dev`, `http://10.10.4.18:8000`, client 234), the `Sales_Reports_KPI`
   endpoint with its request payload and schedule, the table mapping, and the
   middleware settings (port 3002, `http://10.10.4.165:8081/middleware`).
   It contains no SAP passwords — those live only in `middleware/.env`.
   For Production, edit the middleware port/URL block to 3010 / port 9000
   before applying.

   ```bash
   docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
     psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < quality-sap-seed.sql
   ```

3. **Sales data** — import the exported `zfisales_detail.csv.gz`
   (33,174 lines, all columns):

   ```bash
   gunzip -c zfisales_detail.csv.gz | docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
     psql -U supabase_admin -d postgres \
     -c "\copy public.zfisales_detail FROM STDIN WITH (FORMAT csv, HEADER true)"

   docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
     psql -U supabase_admin -d postgres -c "select count(*), sum(amount) from zfisales_detail;"
   ```

4. **Middleware `.env`** — on the server it must differ from the laptop copy:

   ```text
   PORT=3002                                          # Production: 3010
   APP_BASE_URL=http://10.10.4.165:8081/middleware    # Production: :9000
   MIDDLEWARE_SHARED_SECRET=<openssl rand -hex 32>    # same value in the portal
   SAP_TIMEOUT_MS=600000
   SAP_DEV_BASE_URL=http://10.10.4.18:8000
   SAP_DEV_CLIENT=243
   SAP_DEV_USER=SIPL_MOUNIKA
   SAP_DEV_PASSWORD=<SAP password>
   # Automatic scheduled sync — the static portal has no app server, so the
   # middleware runs the scheduler. Both values are server-side only.
   SUPABASE_URL=http://127.0.0.1:8000                 # Production: :9010
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```

   ```bash
   cd /opt/MIS_Projects/Quality/middleware
   npm install --omit=dev
   pm2 restart mis-q-middleware || pm2 start server.mjs --name mis-q-middleware
   pm2 save
   pm2 logs mis-q-middleware --lines 20   # expect: "scheduler started"
   ```

   Force one sync to verify before waiting for the interval:

   ```bash
   curl -X POST http://127.0.0.1:3002/sync/run \
     -H 'content-type: application/json' \
     -H "x-shared-secret: $MIDDLEWARE_SHARED_SECRET" \
     -d '{"endpoint":"Sales_Reports_KPI"}'
   ```

   The Scheduler tab then shows the run with received / new / updated counts.

## One-shot setup (recommended)

After migrations are applied on the server, run the single script that does
everything else — creates the 5 users, seeds the SAP settings, imports all
33,174 sales lines, and verifies the result:

```bash
cd /opt/MIS_Projects/Quality/deploy
chmod +x quality-setup-all.sh
./quality-setup-all.sh
```

For Production run it with overrides:

```bash
DB_CONTAINER=mis_p_db \
SUPABASE_API=http://10.10.4.165:9000/supabase \
BACKEND_ENV=/opt/MIS_Projects/Production/backend/.env \
./quality-setup-all.sh
```

The script ends by printing the three `middleware/.env` lines to change
(PORT, APP_BASE_URL, MIDDLEWARE_SHARED_SECRET) — those still need your chosen
shared secret, then `pm2 restart mis-q-middleware`.
