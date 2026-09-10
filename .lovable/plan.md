# Quality server: users, middleware, verification (migrations DONE)

The schema reset and full migration run completed successfully on Quality:
`zfisales_detail` exists (0 rows, ready for SAP sync) and all five roles
(`super_admin`, `admin`, `buyer`, `approver`, `viewer`) are seeded.
No Nginx changes are needed — `deploy/nginx/mis-quality.conf` already proxies
`/middleware/` on port 8081 to `127.0.0.1:3002`.

## Step 1 — Create all five users (next action)

The repo already contains the ready-to-run script `deploy/create-users.sh`.
Upload it to the server and run it:

```bash
# upload deploy/create-users.sh to /opt/MIS_Projects/Quality/ (e.g. via WinSCP), then:
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a
bash /opt/MIS_Projects/Quality/create-users.sh
```

What it does, in one pass:

- Creates the five Auth accounts through the Quality Auth admin endpoint
  (port 8081) with `email_confirm: true` and temporary password `Welcome@2026`:

| Name | Email | Username | Contact | Plant | Department | Role |
|---|---|---|---|---|---|---|
| sharvi admin | masteradmin@sharviinfotech.com | sharvi | 9090909090 | — | — | Sharvi Admin |
| Bhavani Shankar Anupindi | abshankar@hbl.in | 44195 | 9393012944 | — | IT Application | Admin |
| Ram Koti | koti@hbl.in | 51270 | 9898989898 | 1600 | Sales | User |
| Sunil Kumar Akula | sunilkumar@sharviinfotech.com | 0056 | 7989328372 | 1600 | Devloper | User |
| Demo User | demo@nexus-portal.app | demo | — | — | — | Sharvi Admin |

- Fills each profile (username, names, contact, plant, department, status) and
  assigns the role (`super_admin` / `admin` / `user`) plus the matching legacy
  `user_roles` row.
- Prints the final user list for verification.

Notes:

- The `sharvi.admin@siplproducts.com` Auth account created earlier still exists
  in Auth; it is not in the five hosted users above, so the script leaves it
  untouched. If you want it as the portal admin instead, say so and the script
  is adjusted.
- Passwords cannot be exported from the hosted system — everyone signs in with
  `Welcome@2026` and changes it after first login.
- Alternative for the last four users: run the script for Sharvi Admin only,
  then add the rest via **Administration → User Management** in the portal.

## Step 2 — Install the SAP middleware (port 3002)

```bash
# upload the ROOT middleware/ folder (server.mjs, package.json, .env.example)
# to /opt/MIS_Projects/Quality/middleware/ — that is the real service;
# there is intentionally no middleware folder inside deploy/
cd /opt/MIS_Projects/Quality/middleware
cp .env.example .env
nano .env   # PORT=3002
            # APP_BASE_URL=http://10.10.4.165:8081/middleware
            # MIDDLEWARE_SHARED_SECRET (same value as stored in the portal)
            # SAP base URLs, clients, usernames, passwords
npm install --omit=dev
pm2 start server.mjs --name mis-q-middleware
pm2 save
```

Then in the portal: **Administration → SAP API Settings → Middleware**, set the
middleware URL to `http://10.10.4.165:8081/middleware` and run
**Test Connection**.

## Step 3 — Verify Quality

- Login at `http://10.10.4.165:8081` with `sharvi` / `Welcome@2026` (or email)
- Launchpad tiles, Net Sales dashboard, Management Dashboard load
- Administration → Users / Roles / Permissions / SAP API Settings open
- SAP API Settings → Test Connection reaches SAP through the middleware
- `zfisales_detail` starts empty — trigger a SAP sync from SAP API Settings,
  or re-import the Excel file, to populate the dashboards

## Step 4 — Repeat for Production

Same steps with the Production differences:

- Build the frontend with `VITE_SUPABASE_URL=http://10.10.4.165:9000/supabase`
  and the Production **anon** JWT (never the service_role JWT in a VITE_ var)
- Paths under `/opt/MIS_Projects/Production/...`, containers `mis_p_*`,
  middleware port 3010, `APP_BASE_URL=http://10.10.4.165:9000/middleware`
- Run create-users with:
  `SUPABASE_API=http://10.10.4.165:9000/supabase DB_CONTAINER=mis_p_db bash create-users.sh`
- Never run `docker compose down -v` on either environment — it wipes the DB

## Repo changes

None — `deploy/create-users.sh` already exists and matches the hosted user
data. Server-side procedure only from here.
