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
