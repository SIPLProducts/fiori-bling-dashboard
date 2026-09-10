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
2. The database requires its password even from inside the container. Load it
   from the existing backend `.env` without printing it, then apply the five
   migrations that failed in the terminal output:

```bash
cd /opt/MIS_Projects/Quality/backend
set -a
source .env
set +a

for f in \
  20260902061812_2a548a62-5eec-410e-bf60-3fed50510f14.sql \
  20260902071515_aed71e84-f1ae-46b8-9bd6-4eeb972905ef.sql \
  20260902071633_9c236de1-e2c8-4cbc-a304-d25620ac94cb.sql \
  20260902173656_31331764-b81d-41f0-b937-6fcdbce88438.sql \
  20260909024306_c058a5bf-ce28-4b41-b8f1-6891d3307bf6.sql; do
  echo "==> $f"
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
    < "/opt/MIS_Projects/Quality/supabase/migrations/$f" || break
done
```

The loop now stops on the first real SQL error instead of incorrectly calling
every failure “already applied.” If it reports `already exists`, first inspect
the named object before deciding to skip that migration. Verify afterwards:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select count(*) from zfisales_detail; select key from roles order by sort_order;"
```

## Step 3 — Bring the existing users to Quality

Lovable-hosted users are in a different authentication database and do not
appear on this server automatically. Copy the user list, profile fields, role
assignments, and screen permissions to Quality. Passwords are not copied or
displayed; create each account with a temporary password and require the user
to change it after first login.

Create the first Sharvi Admin through the local Auth Admin API so the auth
schema, identities, profile trigger, and role trigger stay consistent:

```bash
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a

read -s -p "Temporary admin password: " ADMIN_PASSWORD; echo
curl --fail-with-body -X POST http://127.0.0.1:8000/auth/v1/admin/users \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"sharvi.admin@siplproducts.com\",\"password\":\"$ADMIN_PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"username\":\"sharvi.admin\",\"first_name\":\"Sharvi\",\"last_name\":\"Admin\"}}"
unset ADMIN_PASSWORD
```

The `handle_new_user` trigger automatically grants the first user the
`super_admin` role with full access. Log in at `http://10.10.4.165:8081`, then
create the remaining existing users in **Administration → User Management**
with their matching usernames, profile fields, roles, and temporary passwords.
This is the safe migration path because existing password hashes are not
exported from the hosted authentication service.

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
