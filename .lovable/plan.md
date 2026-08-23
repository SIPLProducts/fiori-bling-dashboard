# Deploy folder with plain HTTP Nginx configs

Add a `deploy/` folder to the repository (so it lands in Git) containing Nginx
configs that use only the port matrix you already shared — no SSL / 443 blocks.

## What gets created

```text
deploy/
  README.md                  how to install/enable the configs
  nginx/
    mis-quality.conf         Quality stack
    mis-production.conf      Production stack
```

## Port mapping used (no 443, no certbot)

| Component        | Quality | Production |
| ---------------- | ------- | ---------- |
| Frontend / app   | 8081    | 9000       |
| Middleware       | 3002    | 3010       |
| Backend          | 5000    | 5001       |
| Supabase Kong    | 8000    | 9010       |
| Supabase Studio  | 8082    | 9012       |
| PostgreSQL       | 5432    | 5433       |

## Nginx config contents (each file)

- `listen 80;` only — no `listen 443 ssl`, no `ssl_certificate`, no HTTP→HTTPS
  redirect, no Certbot ACME block.
- `server_name` set to the environment host (Quality and Production hosts; if
  you prefer bare IP + port access, `server_name _;` variant is included as a
  commented alternative).
- Locations, all proxying to `127.0.0.1`:
  - `/` → app port (8081 / 9000)
  - `/middleware/` → 3002 / 3010
  - `/backend/` → 5000 / 5001
  - `/supabase/` → Kong 8000 / 9010
  - `/studio/` → Studio 8082 / 9012
  - `/healthz` → app health endpoint
- Standard proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`,
  `X-Forwarded-Proto`), WebSocket upgrade headers, 60s proxy timeouts,
  `client_max_body_size 25m`, gzip for static assets.

## deploy/README.md

Short install steps: copy file to `/etc/nginx/sites-available/`, symlink into
`sites-enabled/`, `nginx -t`, `systemctl reload nginx`, plus a note that TLS is
terminated elsewhere (upstream LB / existing reverse proxy) so these blocks stay
HTTP-only.

## Notes

- Nothing in the application code changes.
- The existing runbook PDF/MD in your documents stays as-is; these repo files
  become the source of truth for the Nginx layer.

## Added: Docker files for server deployment

```text
deploy/
  docker/
    Dockerfile                     multi-stage build of the TanStack Start app
    .dockerignore
    docker-compose.quality.yml     Quality stack
    docker-compose.production.yml  Production stack
    .env.quality.example
    .env.production.example
    supabase/kong.yml              Kong declarative routes (shared)
```

### Dockerfile
Two stages on `node:22-alpine`: install deps + `npm run build`, then a slim
runtime stage running the built server (`node .output/server/index.mjs`),
non-root user, `PORT` from env, `HEALTHCHECK` on `/`.

### docker-compose per environment
Each file defines an isolated network and named volumes (no sharing between
Quality and Production) with services:

| Service   | Image                     | Quality host port | Production host port |
| --------- | ------------------------- | ----------------- | -------------------- |
| app       | built from Dockerfile     | 127.0.0.1:8081    | 127.0.0.1:9000       |
| db        | supabase/postgres         | 127.0.0.1:5432    | 127.0.0.1:5433       |
| kong      | kong (Supabase gateway)   | 127.0.0.1:8000    | 127.0.0.1:9010       |
| auth      | supabase/gotrue           | internal          | internal             |
| rest      | postgrest                 | internal          | internal             |
| realtime  | supabase/realtime         | internal          | internal             |
| storage   | supabase/storage-api      | internal          | internal             |
| meta      | supabase/postgres-meta    | internal          | internal             |
| studio    | supabase/studio           | 127.0.0.1:8082    | 127.0.0.1:9012       |
| migrate   | supabase/postgres (psql)  | one-shot: applies `supabase/migrations/*.sql` in order |

All published ports bind to `127.0.0.1` so only Nginx reaches them.

### Env example files
`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`,
`SITE_URL`, `API_EXTERNAL_URL`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `PORT`, plus
generation commands for the secrets. No real secrets committed.

### deploy/README.md additions
Commands to build and start each stack:
`docker compose --env-file .env.quality -f docker-compose.quality.yml up -d --build`,
log/health checks, how migrations are applied, and how to redeploy after a
`git pull`.
