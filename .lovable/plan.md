# Deploy latest MIS Portal to 10.10.4.165 (Quality first, then Production)

Your server still runs the old build (demo user, no SAP, no user management).
This plan brings it up to the current version: new UI (Net Sales, Management
Dashboard, Administration), new database tables, and the SAP middleware on
port 3002. Quality is updated and verified first, then the same steps are
repeated for Production.

## What changes on the server

- `frontend/dist` — completely replaced with the new build
- `supabase/migrations` — new table/role/SAP migrations applied to the existing
  Quality database (no `down -v`, existing data is kept)
- `middleware/` — currently empty; the Node.js SAP middleware is installed and
  run with PM2 on port 3002
- First admin user (e.g. Sharvi Admin) created by a one-time SQL script
- Nginx configs stay as they are — the port matrix and routes already match

## Step 0 — Repo fix: make `build:static` work on Windows

`npm run build:static` fails on Windows PowerShell with
`'STATIC_BUILD' is not recognized` because the script uses Unix env syntax.
Fix in the repo: change the script to a small Node wrapper
(`scripts/build-static.mjs`) that sets `STATIC_BUILD=1` itself and then runs
the Vite build plus `flatten-dist.mjs`, and update `package.json` to
`"build:static": "node scripts/build-static.mjs"`. After that, the same
`npm run build:static` command works on Windows, macOS and Linux.

## Step 1 — Build the frontend locally (VS Code)

```bash
# in the project root, create a .env.production.local for the build:
VITE_SUPABASE_URL=http://10.10.4.165:8081/supabase
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY from Quality backend .env>
VITE_SUPABASE_PROJECT_ID=mis-quality

npm install
npm run build:static
```

Upload the **contents** of the new `dist/` via WinSCP to
`/opt/MIS_Projects/Quality/frontend/dist/` (delete the old files inside first).
The `VITE_*` values are baked into the bundle, so Production later needs its own
build with port 9000 and the Production anon key.

Note on folders: the middleware lives at the project root in `middleware/`
(`server.mjs`, `package.json`, `.env.example`) — that is the one to upload.
There is intentionally no middleware folder inside `deploy/`.

## Step 2 — Apply ALL migrations (Quality database is empty)

The error `relation "public.app_crypto_keys" does not exist` proves the Quality
database never received the application schema — no tables at all. So every
migration must run from the first one, in filename order, not just the last
five.

1. Upload all files from the repo's `supabase/migrations/` to
   `/opt/MIS_Projects/Quality/supabase/migrations/`.
2. Run them all in order, loading the database password from the backend
   `.env` (it is required even inside the container):

```bash
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a

for f in $(ls /opt/MIS_Projects/Quality/supabase/migrations/*.sql | sort); do
  echo "==> $(basename $f)"
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$f" || break
done
```

The loop stops at the first real error so nothing is silently skipped. Verify:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select count(*) from zfisales_detail; select key from roles order by sort_order;"
```

## Step 3 — Link the admin user and bring the other users over

The Sharvi Admin account was already created successfully in Auth
(`sharvi.admin@siplproducts.com`). Because the tables did not exist at that
moment, its profile and role rows were not created by the trigger. After Step 2
completes, create them once:

```bash
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres <<'SQL'
INSERT INTO public.profiles (id, email, username, first_name, last_name, status)
SELECT id, email, 'sharvi.admin', 'Sharvi', 'Admin', 'active'
FROM auth.users WHERE email = 'sharvi.admin@siplproducts.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_role_assignments (user_id, role_key)
SELECT id, 'super_admin' FROM auth.users
WHERE email = 'sharvi.admin@siplproducts.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'sharvi.admin@siplproducts.com'
ON CONFLICT DO NOTHING;
SQL
```

Log in at `http://10.10.4.165:8081` with that email or username, then create
the remaining users in **Administration → User Management** with their
usernames, profile fields, roles and temporary passwords. Password hashes are
not exported from the hosted service, so each user sets a new password on first
login.


## Step 4 — Install the SAP middleware (port 3002)

```bash
# upload middleware/server.mjs, package.json, .env.example to
# /opt/MIS_Projects/Quality/middleware/ then on the server:
cd /opt/MIS_Projects/Quality/middleware
cp .env.example .env
nano .env   # fill in: PORT=3002, APP_BASE_URL=http://10.10.4.165:8081/middleware,
            # MIDDLEWARE_SHARED_SECRET (same value stored in Lovable Cloud),
            # SAP_DEV/QUALITY base URLs, clients, users, passwords
npm install --omit=dev
pm2 start server.mjs --name mis-q-middleware
pm2 save
```

The Nginx `/middleware/` block on 8081 already proxies to 127.0.0.1:3002 — no
Nginx change needed. Then in the portal: **Administration → SAP API Settings →
Middleware**, set the middleware URL to `http://10.10.4.165:8081/middleware`
and run **Test Connection**.

## Step 5 — Verify Quality

- Login works with the new admin user (no demo-user button on this build)
- Launchpad tiles, Net Sales dashboard, Management Dashboard load
- Administration → Users / Roles / Permissions / SAP API Settings open
- SAP API Settings → Test Connection reaches SAP through the middleware
- Sales data: `zfisales_detail` starts empty — either trigger a SAP sync from
  SAP API Settings or re-import the Excel file to populate the dashboards

## Step 6 — Repeat for Production

Same five steps with the Production differences:
- build with `VITE_SUPABASE_URL=http://10.10.4.165:9000/supabase` and the
  Production anon key
- Production correction: `VITE_SUPABASE_PUBLISHABLE_KEY` must use the anon JWT
  (the one whose payload role is `anon`), never the `service_role` JWT. Keep the
  service-role key only as `SERVICE_ROLE_KEY` in the server's private `.env`.
- paths under `/opt/MIS_Projects/Production/...`, containers `mis_p_*`,
  DB port 5433, middleware port 3010, `APP_BASE_URL=http://10.10.4.165:9000/middleware`
- create the Production admin user with a different password

## Known limitations of the on-prem build (unchanged from before)

- The static Nginx build has no server runtime: the **scheduled** 10-minute
  SAP sync and the server-side test button only run on the hosted Lovable
  deployment. On-prem, syncs are triggered manually from SAP API Settings, or
  the hosted deployment keeps syncing and the on-prem portal can be pointed at
  the same data.
- Never run `docker compose down -v` on Quality — it wipes the database.

## Repo changes

None — this is a server procedure only; `deploy/README.md` already documents
the layout. No application code changes.
