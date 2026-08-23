# Finish the Quality `.env` — keys, database access, Studio, ports

Your `.env` is almost complete. Three things are still placeholders or pointing at the wrong address, and two things (database login, Studio login) are not separate settings at all — they come from values already in the file.

## 1. The two keys are still placeholders

`ANON_KEY` and `SERVICE_ROLE_KEY` are literally `eyJ...anon-jwt...`. Nothing will work until they are real JWTs signed with your `JWT_SECRET`. They are not random strings — they must be generated from that exact secret.

Generate both on the server with one command (uses the Postgres container's node-free approach via Docker):

```bash
cd /opt/MIS_Projects/Quality/backend
docker run --rm -e JWT_SECRET="$(grep ^JWT_SECRET .env | cut -d= -f2)" node:20-alpine sh -c '
npm i -s jsonwebtoken >/dev/null 2>&1
node -e "
const jwt=require(\"jsonwebtoken\");
const s=process.env.JWT_SECRET, iat=Math.floor(Date.now()/1000), exp=iat+60*60*24*365*10;
console.log(\"ANON_KEY=\"+jwt.sign({role:\"anon\",iss:\"supabase\",iat,exp},s));
console.log(\"SERVICE_ROLE_KEY=\"+jwt.sign({role:\"service_role\",iss:\"supabase\",iat,exp},s));
"'
```

Paste the two printed lines over the placeholder lines, and also set
`VITE_SUPABASE_PUBLISHABLE_KEY` to the **same value as ANON_KEY**.

## 2. The Supabase URLs are wrong for browser access

Kong is published on `127.0.0.1:8000` only — a browser on another machine cannot reach `10.10.4.165:8000`. Public access goes through Nginx on port 80 at the `/supabase/` path:

```
SITE_URL=http://10.10.4.165
API_EXTERNAL_URL=http://10.10.4.165/supabase
VITE_SUPABASE_URL=http://10.10.4.165/supabase
```

(no `:8000`).

Because you are using a bare IP, the Nginx config must also match any host: in `mis-quality.conf` replace `server_name quality.siplproducts.com;` with `server_name _;`.

`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are baked into the browser bundle at build time, so after fixing them you must rebuild locally and re-upload `dist/`.

## 3. Database credentials — already in the file

There is no separate DB username/password setting. The stack uses:

| Item | Quality | Production |
| --- | --- | --- |
| Host / port | `127.0.0.1:5432` | `127.0.0.1:5433` |
| Database | `postgres` | `postgres` |
| User | `postgres` | `postgres` |
| Password | value of `POSTGRES_PASSWORD` | its own `POSTGRES_PASSWORD` |

Connect with:

```bash
docker exec -it mis_q_db psql -U postgres -d postgres
```

## 4. Studio (the dashboard) — no login by default

Self-hosted Studio ships with **no username/password**. It reaches the DB through the `meta` service using `POSTGRES_PASSWORD`, which is already set.

- Quality Studio: `http://10.10.4.165/studio/` (container on `127.0.0.1:8082`)
- Production Studio: same host `/studio/` on the Production server block (`127.0.0.1:9012`)

Since it has no login, protect it in Nginx. Plan: add HTTP basic auth to the `/studio/` block in both `mis-quality.conf` and `mis-production.conf`, with a short README section on creating the password file (`htpasswd`), plus the optional IP allow-list.

## 5. Application login is separate

The MIS portal's own sign-in (including the demo user) is handled by the app's auth tables, not by Studio or Postgres. Nothing extra in `.env` is needed for it.

## Files to change in the repo

- `deploy/docker/.env.quality.example` and `.env.production.example` — correct URL examples (no `:8000`), note that `VITE_SUPABASE_PUBLISHABLE_KEY` equals `ANON_KEY`, and include the key-generation command.
- `deploy/nginx/mis-quality.conf`, `mis-production.conf` — basic-auth on `/studio/`, and a comment about `server_name _;` for IP-only access.
- `deploy/README.md` — new section: generating keys, DB credentials table, Studio access and protection, port matrix reminder.
