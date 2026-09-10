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

## Step 2 — Apply the new database migrations (Quality)

1. Upload all files from the repo's `supabase/migrations/` to
   `/opt/MIS_Projects/Quality/supabase/migrations/` (keep existing ones).
2. Apply **only the migrations not yet applied**, oldest first:

```bash
cd /opt/MIS_Projects/Quality/supabase/migrations
for f in $(ls *.sql | sort); do
  echo "==> $f"
  docker exec -i mis_q_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$f" \
    && echo "applied" || echo "FAILED or already applied — check message above"
done
```

A migration that fails with "already exists" was applied before — skip it and
continue. Verify afterwards:

```bash
docker exec -i mis_q_db psql -U supabase_admin -d postgres -c \
  "select count(*) from zfisales_detail; select key from roles order by sort_order;"
```

## Step 3 — Create the first admin user

One-time script run inside the DB container (replace email/password/username):

```bash
docker exec -i mis_q_db psql -U supabase_admin -d postgres <<'SQL'
WITH u AS (
  INSERT INTO auth.users (id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, aud, role, created_at, updated_at)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'sharvi.admin@siplproducts.com',
    extensions.crypt('ChangeMe!2026', extensions.gen_salt('bf')),
    now(), '{"username":"sharvi.admin","first_name":"Sharvi","last_name":"Admin"}',
    'authenticated', 'authenticated', now(), now())
  RETURNING id
)
INSERT INTO public.profiles (id, email, username, first_name, last_name, status)
SELECT id, 'sharvi.admin@siplproducts.com', 'sharvi.admin', 'Sharvi', 'Admin', 'active' FROM u;
SQL
```

The `handle_new_user` trigger automatically grants the first user the
`super_admin` role with full access. Log in at
`http://10.10.4.165:8081` with that email or username, then change the password
and create the other users from **Administration → User Management**.

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
