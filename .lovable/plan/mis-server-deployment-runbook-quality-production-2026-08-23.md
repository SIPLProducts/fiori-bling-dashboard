# MIS Server Deployment Runbook (Quality + Production)

Produce a single step-by-step deployment document you can follow on the Ubuntu server, covering two isolated environments (Quality/Staging and Production) under `/opt/MIS_Projects/`, with the approved port matrix.

## Deliverable

A Markdown runbook saved to the project's Files panel (`MIS-Deployment-Runbook.md`), copy-paste ready, with every command in fenced blocks.

## Approved port matrix

| Service Component | Quality (Staging) | Production |
| --- | --- | --- |
| Frontend (Web App) | 8081 | 9000 |
| Middleware (SAP/Core Logic) | 3002 | 3010 |
| Backend API Service | 5000 | 5001 |
| Supabase Kong / API Gateway | 8000 | 9010 |
| Supabase Studio (Dashboard) | 8082 | 9012 |
| PostgreSQL Database | 5432 | 5433 |

## Document sections

1. **Server provisioning** — Ubuntu base setup, Node.js LTS via NodeSource, npm, Git, build-essential, Docker CE + Compose v2, Nginx, PM2, UFW rules (allow 22/80/443 only; internal ports bound to 127.0.0.1).
2. **Directory layout** — creating `/opt/MIS_Projects/{Quality,Production}/{frontend/dist,backend,middleware,supabase}` and `/opt/MIS_Projects/nginx/`, ownership and permissions.
3. **Port allocation table** — the matrix above plus loopback-binding guidance so only Nginx is public.
4. **Environment configuration** — full `.env` templates per environment (frontend build vars, backend, middleware/SAP OData credentials, Supabase URL/keys, JWT secret, Postgres credentials) and secret-generation commands.
5. **Supabase & Postgres self-hosting** — per-environment `docker-compose.yml` with unique container name prefixes, named volumes, and separate Docker networks; Kong/Studio/Postgres port mappings from the matrix; first-boot migration and Studio access steps.
6. **Runtime management** — `ecosystem.config.js` per environment for backend and middleware (cluster mode, log paths, env injection), `pm2 startup`/`save`, and Docker `restart: unless-stopped` policies.
7. **Nginx & SSL** — `mis-quality.conf` and `mis-production.conf` server blocks: static `frontend/dist` serving with SPA fallback, `/api` and `/middleware` reverse proxies, WebSocket upgrade headers, Gzip, static asset caching, security headers, and Certbot issuance/renewal.
8. **Maintenance & recovery** — nightly `pg_dump` cron with rotation and restore procedure, zero-downtime deploy sequence (build → atomic dist swap → `pm2 reload`), health-check commands (`pm2 status`, `docker ps`, `curl` probes, `nginx -t`), and a reboot/recovery SOP.
9. **Deploying this app** — building the TanStack Start dashboard for the server, the env vars it needs, and how it maps onto the frontend/backend ports.

## Assumptions

- Domains: Production on `mis.siplproducts.com`, Quality on `quality.siplproducts.com` — placeholders are clearly marked so they can be swapped.
- Ubuntu 22.04/24.04 LTS; commands noted where they differ.
- Self-hosted Supabase per environment (not Lovable Cloud) as implied by the layout.
