# Fix: port 127.0.0.1:8081 already in use

Everything in the Quality stack started except `mis_q_app` — Docker could not bind
`127.0.0.1:8081` because another process on the server already holds that port.

## 1. Find what is holding 8081

```bash
sudo ss -ltnp | grep 8081
docker ps -a --format '{{.Names}}\t{{.Ports}}' | grep 8081
```

Two likely cases:

- **A leftover Docker container** from an earlier attempt or another stack.
- **A non-Docker service** (an old Node/PM2 process, or an Nginx server block that
  itself listens on 8081).

## 2a. If it is a container

```bash
docker stop <name> && docker rm <name>
```

## 2b. If it is a host process

```bash
sudo kill <pid>          # PID comes from the ss output
```

If it is an Nginx `listen 8081;` block, remove/disable that site and reload Nginx —
our Quality config only needs `listen 80`.

## 3. Bring the app container up

```bash
cd /opt/MIS_Projects/Quality/backend
docker compose --env-file .env up -d app
docker compose ps
docker compose logs -f app
```

## Alternative: move the app to a different host port

If 8081 must stay with the other service, change the app port mapping in
`docker-compose.yml`:

```yaml
  app:
    ports:
      - "127.0.0.1:8091:3000"
```

and update the Nginx upstream in `/etc/nginx/sites-available/mis-quality.conf`:

```nginx
upstream mis_q_app { server 127.0.0.1:8091; keepalive 32; }
```

then `sudo nginx -t && sudo systemctl reload nginx`.
The repo files `deploy/docker/docker-compose.quality.yml` and
`deploy/nginx/mis-quality.conf` would be updated to match.

## 4. Verify

```bash
curl -I http://127.0.0.1:8081/       # app (or 8091 if you moved it)
curl -I http://127.0.0.1:8000/       # Kong
curl -I http://10.10.4.165/          # through Nginx
docker logs mis_q_migrate            # migrations should say "migrations complete"
```

## Recommendation

Free port 8081 (step 2) rather than remapping — the port matrix you approved
assigns 8081 to the Quality frontend/app, and keeping it avoids touching Nginx.
