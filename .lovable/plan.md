# Start the Quality Docker stack

After editing `/opt/MIS_Projects/Quality/backend/.env`, run the following commands on the server.

## 1. Start the Quality stack

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env -f docker-compose.yml up -d --build
```

This starts: Postgres, migrations, GoTrue (auth), PostgREST, Realtime, Storage, Meta, Kong, Studio, and the app container.

## 2. Verify the services are healthy

```bash
docker compose ps
docker compose logs -f app
```

Wait for `mis_q_migrate` to finish (it exits after running migrations).

## 3. Health checks

```bash
# App
curl -I http://127.0.0.1:8081/

# Kong / Supabase API
curl -I http://127.0.0.1:8000/

# Studio (will prompt for basic auth)
curl -I http://127.0.0.1:8082/
```

## 4. Reload Nginx (if config changed)

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Public URLs

| Path | URL |
| ---- | --- |
| Portal | `http://10.10.4.165/` |
| Supabase API | `http://10.10.4.165/supabase/` |
| Studio | `http://10.10.4.165/studio/` |

## Notes

- `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` in `.env` are enforced by Kong basic auth on the Studio route.
- Nginx basic auth on `/studio/` is an additional layer; create the password file with `htpasswd` if not already done.
