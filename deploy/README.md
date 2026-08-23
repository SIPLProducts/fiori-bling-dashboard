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

## 1. Build the frontend locally

In VS Code / your local repo:

```bash
npm install
npm run build
```

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
cp deploy/docker/Dockerfile                     /opt/MIS_Projects/Quality/backend/Dockerfile
cp deploy/docker/docker-compose.quality.yml   /opt/MIS_Projects/Quality/backend/docker-compose.yml
cp deploy/docker/supabase/kong.yml              /opt/MIS_Projects/Quality/supabase/kong.yml
cp -r supabase/migrations/*                     /opt/MIS_Projects/Quality/supabase/migrations/

# Production
cp deploy/docker/Dockerfile                     /opt/MIS_Projects/Production/backend/Dockerfile
cp deploy/docker/docker-compose.production.yml /opt/MIS_Projects/Production/backend/docker-compose.yml
cp deploy/docker/supabase/kong.yml              /opt/MIS_Projects/Production/supabase/kong.yml
cp -r supabase/migrations/*                     /opt/MIS_Projects/Production/supabase/migrations/
```

## 4. Start the stacks

```bash
# Quality
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env -f docker-compose.yml up -d --build

# Production
cd /opt/MIS_Projects/Production/backend
docker compose --env-file .env -f docker-compose.yml up -d --build
```

Database migrations run automatically: the one-shot `migrate` service applies
every file in `supabase/migrations/*.sql` in filename order once Postgres is
healthy. There are no edge functions in this project.

Check status and logs:

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose ps
docker compose logs -f app
docker logs mis_q_migrate           # migration output
curl -I http://127.0.0.1:8081/      # app health (Quality)
curl -I http://127.0.0.1:9000/      # app health (Production)
```

## 5. Nginx

The configs are **plain HTTP (port 80) only** — no `listen 443`, no
`ssl_certificate`, no Certbot, no HTTPS redirect. TLS is terminated on your
existing upstream load balancer / reverse proxy.

Nginx serves static files directly from `frontend/dist/` and falls back to the
app server for SSR and server functions.

```bash
sudo cp deploy/nginx/mis-quality.conf    /etc/nginx/sites-available/
sudo cp deploy/nginx/mis-production.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/mis-quality.conf    /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/mis-production.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Routes exposed by each server block:

| Path           | Quality upstream | Production upstream |
| -------------- | ---------------- | ------------------- |
| `/`            | 8081 (app)       | 9000 (app)          |
| `/_build/*`    | frontend/dist    | frontend/dist       |
| `/middleware/` | 3002             | 3010                |
| `/backend/`    | 5000             | 5001                |
| `/supabase/`   | 8000 (Kong)      | 9010 (Kong)         |
| `/studio/`     | 8082             | 9012                |
| `/healthz`     | app root         | app root            |

If you serve by IP instead of a hostname, swap `server_name` for the commented
`server_name _;` line in the config.

## 6. Redeploy after a code change

Only the frontend `dist/` files need to be replaced; the Docker image does not
change.

```bash
# Upload new .output/* contents to /opt/MIS_Projects/Production/frontend/dist/
# Then restart the app container so it picks up the new volume contents:
cd /opt/MIS_Projects/Production/backend
docker compose restart app
```

If you also changed backend/server logic, rebuild the image:

```bash
cd /opt/MIS_Projects/Production/backend
docker compose up -d --build app
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
