# MIS Portal — Deployment folder

Everything needed to run the MIS portal on your own Ubuntu server, in two fully
isolated stacks: **Quality** and **Production**.

```
deploy/
  README.md
  nginx/
    mis-quality.conf              HTTP-only reverse proxy for Quality
    mis-production.conf           HTTP-only reverse proxy for Production
  docker/
    Dockerfile                    multi-stage build of the app
    .dockerignore
    docker-compose.quality.yml
    docker-compose.production.yml
    .env.quality.example
    .env.production.example
    supabase/kong.yml             Supabase API gateway routes
```

## Port matrix

| Component        | Quality | Production |
| ---------------- | ------- | ---------- |
| Frontend / app   | 8081    | 9000       |
| Middleware       | 3002    | 3010       |
| Backend          | 5000    | 5001       |
| Supabase Kong    | 8000    | 9010       |
| Supabase Studio  | 8082    | 9012       |
| PostgreSQL       | 5432    | 5433       |

All container ports are published to `127.0.0.1` only — Nginx is the single
public entry point.

## 1. Environment files

```bash
cd /opt/MIS_Projects/fiori-bling-dashboard      # your git checkout
cp deploy/docker/.env.quality.example    deploy/docker/.env.quality
cp deploy/docker/.env.production.example deploy/docker/.env.production
```

Fill in the secrets (generation commands are inside each file). Quality and
Production must use **different** `POSTGRES_PASSWORD`, `JWT_SECRET`,
`ANON_KEY` and `SERVICE_ROLE_KEY`.

> `VITE_*` values are inlined into the browser bundle at build time, so they are
> passed as build args. Changing them requires `--build`, not just a restart.

## 2. Start the stacks

```bash
# Quality
docker compose --env-file deploy/docker/.env.quality \
  -f deploy/docker/docker-compose.quality.yml up -d --build

# Production
docker compose --env-file deploy/docker/.env.production \
  -f deploy/docker/docker-compose.production.yml up -d --build
```

Database migrations run automatically: the one-shot `migrate` service applies
every file in `supabase/migrations/*.sql` in filename order once Postgres is
healthy. There are no edge functions in this project.

Check status and logs:

```bash
docker compose -f deploy/docker/docker-compose.quality.yml ps
docker compose -f deploy/docker/docker-compose.quality.yml logs -f app
docker logs mis_q_migrate           # migration output
curl -I http://127.0.0.1:8081/      # app health (Quality)
curl -I http://127.0.0.1:9000/      # app health (Production)
```

## 3. Nginx

The configs are **plain HTTP (port 80) only** — no `listen 443`, no
`ssl_certificate`, no Certbot, no HTTPS redirect. TLS is terminated on your
existing upstream load balancer / reverse proxy.

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
| `/middleware/` | 3002             | 3010                |
| `/backend/`    | 5000             | 5001                |
| `/supabase/`   | 8000 (Kong)      | 9010 (Kong)         |
| `/studio/`     | 8082             | 9012                |
| `/healthz`     | app root         | app root            |

If you serve by IP instead of a hostname, swap `server_name` for the commented
`server_name _;` line in the config.

## 4. Redeploy after a code change

```bash
git pull
docker compose --env-file deploy/docker/.env.production \
  -f deploy/docker/docker-compose.production.yml up -d --build app
```

Only the `app` service is rebuilt; the database and its volume are untouched.

## 5. Backup / restore

```bash
# Backup (Production)
docker exec mis_p_db pg_dump -U postgres postgres | gzip > mis-prod-$(date +%F).sql.gz

# Restore
gunzip -c mis-prod-2026-08-23.sql.gz | docker exec -i mis_p_db psql -U postgres -d postgres
```
