# Quality stack — next steps after `docker compose up`

## What the screenshot shows

`http://10.10.4.165:8000` times out because the API gateway (Kong) is published
as `127.0.0.1:8000` — loopback only, deliberately. It is not reachable from your
laptop and it should not be. Everything goes through Nginx on port 80:

| What | Correct URL |
| ---- | ----------- |
| Portal | `http://10.10.4.165/` (or `:8081` if you keep that block) |
| Supabase API | `http://10.10.4.165/supabase/` |
| Studio dashboard | `http://10.10.4.165/studio/` |

So "Supabase unable to login" is expected on `:8000` — use `/studio/`.

## Also: your compose is the old one

The output still starts `mis_q_app`. The frontend is now a static `dist/`
served by Nginx, so that container should be gone. Re-upload
`deploy/docker/docker-compose.quality.yml` as
`/opt/MIS_Projects/Quality/backend/docker-compose.yml` and recreate.

## Steps to run on the server

```bash
cd /opt/MIS_Projects/Quality/backend

# 1. drop the obsolete frontend container
docker compose --env-file .env -f docker-compose.yml up -d --remove-orphans
docker rm -f mis_q_app 2>/dev/null || true

# 2. confirm the gateway answers locally
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8082/

# 3. confirm it answers through Nginx
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/
curl -s -o /dev/null -w '%{http_code}\n' -u supabase:<studio-pass> http://127.0.0.1/studio/

# 4. migrations actually applied?
docker logs mis_q_migrate --tail 30
```

## Studio login

Two layers guard `/studio/`:

1. **Nginx basic auth** — create the file if you have not yet:
   ```bash
   sudo apt install -y apache2-utils
   sudo htpasswd -c /etc/nginx/.mis-studio supabase
   sudo nginx -t && sudo systemctl reload nginx
   ```
2. **Kong basic auth** — `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` from
   `.env`. If either is still `change-me-…`, set a real value and restart Kong:
   ```bash
   docker compose --env-file .env -f docker-compose.yml up -d --force-recreate kong studio
   ```

Studio itself has no login screen — if the browser prompt is rejected, the
password is wrong in one of those two layers.

## Frontend must point at the Nginx path

`VITE_SUPABASE_URL` is baked in at build time. It must be
`http://10.10.4.165/supabase` (or `http://quality.siplproducts.com/supabase`),
never `:8000`. If the current `dist/` was built with the Lovable cloud URL,
rebuild with the Quality values and re-upload `dist/`.

## Repo changes in this plan

None required unless step 4 shows failed migrations, or you want the port-8081
Nginx block folded into the main `mis-quality.conf` — say the word and I will
adjust `deploy/nginx/mis-quality.conf` to listen on 8081 as well.
