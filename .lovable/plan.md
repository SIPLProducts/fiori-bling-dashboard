# Corrected MIS Deployment Runbook (PDF)

Rewrite the deployment runbook to match how the repository is actually structured, and deliver it as a PDF (plus the updated Markdown).

## Corrections to make

1. **No edge functions.** The repo's backend folder contains only `migrations/` and `config.toml`. All server logic runs inside the app itself (TanStack server functions bundled with the frontend build). The runbook will drop every edge-function step and instead explain that migrations are the only SQL artefact to apply per environment.
2. **One app process, not separate "frontend + backend + middleware" codebases.** This app is a single full-stack build: the Node server serves both the UI and the server functions. The runbook will state this plainly and keep the extra ports reserved for the optional SAP middleware service only.
3. **Docker instances for Quality and Production** — two fully isolated self-hosted stacks, each with its own compose project name, container prefix, network, named volumes, and `.env`:

| Component | Quality | Production |
| --- | --- | --- |
| App (web + server fns) | 8081 | 9000 |
| SAP middleware (optional) | 3002 | 3010 |
| Backend API (optional) | 5000 | 5001 |
| Kong / API gateway | 8000 | 9010 |
| Studio | 8082 | 9012 |
| PostgreSQL | 5432 | 5433 |

Each stack gets: `docker compose -p mis_quality` / `-p mis_production`, `db`, `kong`, `auth`, `rest`, `realtime`, `storage`, `meta`, `studio` services, healthchecks, `restart: unless-stopped`, and all ports bound to `127.0.0.1` so only Nginx is public.

## Frontend `.env` mapping

A dedicated section showing the current Lovable Cloud values and exactly what replaces them per environment when self-hosting:

| Variable | Now (Lovable Cloud) | Replace with |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | the cloud project URL | `https://quality.<domain>/supabase` or `https://mis.<domain>/supabase` (public Kong URL) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | cloud publishable key | the `ANON_KEY` generated for that stack |
| `VITE_SUPABASE_PROJECT_ID` | cloud project ref | any stable env label, e.g. `mis-quality` / `mis-prod` |
| `SUPABASE_URL` (server) | cloud URL | internal `http://127.0.0.1:8000` / `:9010` |
| `SUPABASE_PUBLISHABLE_KEY` (server) | cloud key | same `ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` (server, new) | not in your file | the stack's `SERVICE_ROLE_KEY` — server-only, never `VITE_` |

Plus: `VITE_*` are baked in at build time (rebuild after changing them), key/JWT generation commands, and a note that a Lovable-Cloud-hosted deployment needs no changes at all.

## Document sections (final order)

1. What this app is and what actually gets deployed
2. Server provisioning (Ubuntu, Node LTS, Docker CE + Compose v2, Nginx, PM2, UFW)
3. Directory layout under `/opt/MIS_Projects/{Quality,Production}`
4. Port matrix and loopback binding
5. Environment configuration — full `.env` templates + the mapping table above
6. Self-hosted Postgres + Supabase Docker stacks (Quality and Production compose files)
7. Applying database migrations to each stack
8. Building and running the app (PM2 ecosystem per environment)
9. Nginx server blocks + Certbot SSL for both domains
10. Backups, zero-downtime deploys, health checks, reboot/recovery SOP
11. Troubleshooting

## Deliverables

- `MIS-Deployment-Runbook-v2.pdf` — the primary document, generated with proper page breaks, styled tables, and monospaced command blocks
- `MIS-Deployment-Runbook-v2.md` — same content in Markdown for copy-paste of commands

Every page of the PDF will be rendered to images and visually inspected before delivery.
