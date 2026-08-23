# Add Studio dashboard login (DASHBOARD_USERNAME / DASHBOARD_PASSWORD)

Your other project uses the **official Supabase docker-compose bundle**, which ships a Kong basic-auth layer in front of Studio. That is where `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` come from — they are not a Supabase product feature, they are a Kong basic-auth credential defined in that bundle's `kong.yml`.

Our MIS stack is a trimmed-down custom compose, so it has no dashboard credentials yet. This plan adds the same thing.

## What gets added

**1. `.env` (both environments)** — two new variables in `deploy/docker/.env.quality.example` and `.env.production.example`:

```
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=<openssl rand -hex 12>
```

**2. `deploy/docker/supabase/kong.yml`** — add a `dashboard` consumer with basic-auth credentials, and route Studio through Kong (mirrors the official bundle):

```yaml
consumers:
  - username: DASHBOARD
    basicauth_credentials:
      - username: $DASHBOARD_USERNAME
        password: $DASHBOARD_PASSWORD

services:
  - name: dashboard
    url: http://studio:3000/
    routes:
      - name: dashboard
        strip_path: true
        paths: [/]
    plugins:
      - name: cors
      - name: basic-auth
        config: { hide_credentials: true }
```

**3. `docker-compose.quality.yml` / `docker-compose.production.yml`** — pass `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` into the `kong` service environment so Kong can substitute them.

## Simpler alternative (recommended for our layout)

Because Nginx already fronts everything and Studio is published on `127.0.0.1:8082` / `9012`, HTTP basic auth in Nginx gives the same protection with fewer moving parts:

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.mis-studio supabase   # prompts for password
```

```nginx
location /studio/ {
    proxy_pass http://mis_q_studio/;
    auth_basic "MIS Studio";
    auth_basic_user_file /etc/nginx/.mis-studio;
}
```

Then `http://10.10.4.165/studio/` asks for username + password.

## Note on the other project's `.env`

That file is for the official Supabase bundle and has extra services we do not run (pooler/Supavisor, Logflare analytics, imgproxy, vault, SMTP). Do not copy it into `/opt/MIS_Projects/Quality/backend/.env` — only the two dashboard variables are relevant.

## Files to change

- `deploy/docker/.env.quality.example`, `.env.production.example` — add `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`.
- `deploy/docker/supabase/kong.yml` — dashboard consumer + basic-auth route.
- `deploy/docker/docker-compose.quality.yml`, `docker-compose.production.yml` — pass the two variables to Kong.
- `deploy/nginx/mis-quality.conf`, `mis-production.conf` — basic-auth block on `/studio/`.
- `deploy/README.md` — section on Studio credentials and how to create/rotate them.
