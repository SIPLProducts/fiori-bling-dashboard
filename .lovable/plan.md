# Deployment file mapping for existing Quality/Production split

You will keep the existing `/opt/MIS_Projects/Quality/` and `/opt/MIS_Projects/Production/` folder structure. The plan below tells you exactly which files from the repo go into each folder, and which files are not needed.

## What you need from the repo

Generate or copy these from your local VS Code checkout, then upload via WinSCP:

| Source in repo | Destination on server | What it is |
| -------------- | --------------------- | ---------- |
| `.output/` contents (after `npm run build`) | `Quality/frontend/dist/` and `Production/frontend/dist/` | Built TanStack Start app (HTML/JS/CSS/server bundle). |
| `deploy/docker/Dockerfile` | `Quality/backend/` and `Production/backend/` | App runtime image build file. |
| `deploy/docker/docker-compose.quality.yml` | `Quality/backend/docker-compose.yml` | Quality stack orchestration. |
| `deploy/docker/docker-compose.production.yml` | `Production/backend/docker-compose.yml` | Production stack orchestration. |
| `deploy/docker/.env.quality.example` → filled as `.env.quality` | `Quality/backend/.env` | Quality environment secrets. |
| `deploy/docker/.env.production.example` → filled as `.env.production` | `Production/backend/.env` | Production environment secrets. |
| `deploy/docker/supabase/kong.yml` | `Quality/supabase/kong.yml` and `Production/supabase/kong.yml` | Kong gateway routes (same file for both). |
| `supabase/migrations/*.sql` | `Quality/supabase/migrations/` and `Production/supabase/migrations/` | Database migrations (same files for both). |
| `deploy/nginx/mis-quality.conf` | `/opt/MIS_Projects/nginx/mis-quality.conf` | Nginx server block for Quality. |
| `deploy/nginx/mis-production.conf` | `/opt/MIS_Projects/nginx/mis-production.conf` | Nginx server block for Production. |

## What you do NOT need to copy

- `deploy/docker/.dockerignore` — only used when building inside the repo; not needed on the server if you upload a pre-built `dist/`.
- `deploy/README.md` — for reference only; already documented.
- `node_modules/` — never upload; dependencies are installed at build time.
- `src/`, `public/` — these are source files; the built app lives in `.output/` locally and is copied to `dist/` on the server.
- Edge functions folder — this project has no edge functions.

## Is supabase the same as backend?

No, they are separate:

- **backend** = the TanStack Start application (your portal UI + server functions). It runs the app on port 8081 (Quality) or 9000 (Production).
- **supabase** = the self-hosted database/auth stack (Postgres, GoTrue, PostgREST, Kong, Studio, etc.). It runs on ports 8000/8082 (Quality) or 9010/9012 (Production).

The `backend` container needs to reach the `supabase` Kong container so the app can talk to Postgres/Auth. Both are started from the same `docker-compose.yml` in each environment's `backend/` folder.

## Recommended final folder layout on the server

```text
/opt/MIS_Projects/
├── backups/
├── nginx/
│   ├── mis-quality.conf
│   └── mis-production.conf
├── Quality/
│   ├── frontend/
│   │   └── dist/                 # built app files copied from .output/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml    # renamed from docker-compose.quality.yml
│   │   └── .env                  # renamed from .env.quality
│   ├── middleware/               # only if you have a middleware service
│   └── supabase/
│       ├── kong.yml
│       └── migrations/*.sql
└── Production/
    ├── frontend/
    │   └── dist/                 # built app files copied from .output/
    ├── backend/
    │   ├── Dockerfile
    │   ├── docker-compose.yml    # renamed from docker-compose.production.yml
    │   └── .env                  # renamed from .env.production
    ├── middleware/               # only if you have a middleware service
    └── supabase/
        ├── kong.yml
        └── migrations/*.sql
```

## Nginx frontend handling

Nginx will serve static files directly from `frontend/dist/` and fall back to the app server for SSR/server functions:

```nginx
root /opt/MIS_Projects/Quality/frontend/dist;

# Static assets with long cache
location /_build/ {
    try_files $uri $uri/ =404;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
}

# Everything else goes to the TanStack Start app for SSR and server functions
location / {
    try_files $uri $uri/ @app;
}

location @app {
    proxy_pass http://mis_q_app;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        $connection_upgrade_q;
}
```

The Production config is identical except the root path and upstream names point to `Production/frontend/dist` and port 9000.

## Steps to deploy

1. **Build locally in VS Code**
   ```bash
   npm install
   npm run build
   ```
   This creates `.output/` in your repo root.

2. **Upload built app into `dist/`**
   - Copy everything inside `.output/` to `Quality/frontend/dist/`.
   - Copy the same contents to `Production/frontend/dist/`.

3. **Upload Docker files**
   - Copy `deploy/docker/Dockerfile` to both `Quality/backend/` and `Production/backend/`.
   - Copy `deploy/docker/docker-compose.quality.yml` to `Quality/backend/docker-compose.yml`.
   - Copy `deploy/docker/docker-compose.production.yml` to `Production/backend/docker-compose.yml`.
   - Copy `deploy/docker/.env.quality.example` to `Quality/backend/.env` and fill in real secrets.
   - Copy `deploy/docker/.env.production.example` to `Production/backend/.env` and fill in real secrets.

4. **Upload Supabase files**
   - Copy `deploy/docker/supabase/kong.yml` to both `Quality/supabase/` and `Production/supabase/`.
   - Copy `supabase/migrations/*.sql` to both `Quality/supabase/migrations/` and `Production/supabase/migrations/`.

5. **Upload Nginx configs**
   - Copy `deploy/nginx/mis-quality.conf` to `/opt/MIS_Projects/nginx/mis-quality.conf`.
   - Copy `deploy/nginx/mis-production.conf` to `/opt/MIS_Projects/nginx/mis-production.conf`.
   - Symlink them into `/etc/nginx/sites-enabled/` and reload Nginx.

6. **Start each stack**
   ```bash
   cd /opt/MIS_Projects/Quality/backend
   docker compose up -d --build

   cd /opt/MIS_Projects/Production/backend
   docker compose up -d --build
   ```

## Note on the Dockerfile

The `Dockerfile` will be updated to copy the app from `../frontend/dist/` instead of the repo's `.output/` path, so it matches the server folder layout shown above.


