# Fix: Nginx is holding port 8081

`ss` shows the listener on `0.0.0.0:8081` is **Nginx**, not a stray container.
An existing Nginx server block has `listen 8081;` and proxies to `mis_q_app`,
so Nginx and the app container are fighting over the same port.

That block is a leftover from the earlier setup. Our `mis-quality.conf` listens on
port 80 and proxies to `127.0.0.1:8081`, so 8081 must belong to the container only.

## 1. Find the offending server block

```bash
sudo grep -rn "listen 8081" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ /etc/nginx/nginx.conf
```

## 2. Disable it

If it is an old Quality site file that our `mis-quality.conf` replaces:

```bash
sudo rm /etc/nginx/sites-enabled/<old-file>
```

If you want to keep the file but only drop the port, edit it and delete the
`listen 8081;` line (keep `listen 80;`).

Make sure the enabled set is what you expect, then reload:

```bash
ls -l /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo ss -ltnp | grep 8081     # should now print nothing
```

## 3. Start the app container

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env up -d app
docker compose ps
docker compose logs -f app
```

## 4. Verify end to end

```bash
curl -I http://127.0.0.1:8081/    # app container directly
curl -I http://127.0.0.1:8000/    # Kong
curl -I http://10.10.4.165/       # portal through Nginx on port 80
docker logs mis_q_migrate         # expect "migrations complete"
```

## Fallback if 8081 must stay on Nginx

Remap the container instead: `"127.0.0.1:8091:3000"` in the `app` service, and
point the Nginx upstream at `127.0.0.1:8091`. The repo copies
(`deploy/docker/docker-compose.quality.yml`, `deploy/nginx/mis-quality.conf`)
would be updated to match. Removing the duplicate block (step 2) is cleaner and
keeps the approved port matrix intact.
