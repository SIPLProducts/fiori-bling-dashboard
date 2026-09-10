# Quality server: users, SAP settings, data and middleware (migrations DONE)

Migrations are fully applied on Quality: `zfisales_detail` exists (0 rows) and
all five roles are seeded. No Nginx change is needed — `mis-quality.conf`
already proxies `/middleware/` on 8081 to `127.0.0.1:3002`.

Remaining work: users, the SAP configuration, the 33,174 sales rows, and the
middleware itself.

## Step 1 — Create all five users

Run the existing script `deploy/create-users.sh` (already in the repo):

```bash
# upload deploy/create-users.sh to /opt/MIS_Projects/Quality/, then:
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a
bash /opt/MIS_Projects/Quality/create-users.sh
```

| Name | Email | Username | Contact | Plant | Department | Role |
|---|---|---|---|---|---|---|
| sharvi admin | masteradmin@sharviinfotech.com | sharvi | 9090909090 | — | — | Sharvi Admin |
| Bhavani Shankar Anupindi | abshankar@hbl.in | 44195 | 9393012944 | — | IT Application | Admin |
| Ram Koti | koti@hbl.in | 51270 | 9898989898 | 1600 | Sales | User |
| Sunil Kumar Akula | sunilkumar@sharviinfotech.com | 0056 | 7989328372 | 1600 | Devloper | User |
| Demo User | demo@nexus-portal.app | demo | — | — | — | Sharvi Admin |

Passwords cannot be exported, so everyone starts with `Welcome@2026` and
changes it after first login.

## Step 2 — Copy the SAP configuration to the server (new)

I will generate `deploy/quality-sap-seed.sql` containing the exact
configuration rows from the current live system:

- **SAP system** `dev` / SAP DEV / DEV, base URL `http://10.10.4.18:8000`,
  client `234`, user `SIPL_MOUNIKA`, active
- **SAP endpoint** `Sales_Reports_KPI` (module `common`), POST
  `/fisales_detail/report?sap-client=234`, scheduler on, `*/5 * * * *`,
  including the full request payload (BUKRS/BUDAT_F/BUDAT_T/PRCTR/WERKS) and
  the stored sample response
- **Middleware config** row, set for the server: connection mode `proxy`,
  port `3002`, URL `http://10.10.4.165:8081/middleware`
- **Table mapping** for `zfisales_detail` linked to that endpoint

The SAP password is not in the database (it lives only in the middleware
`.env`), so nothing secret is in this file. Apply it after Step 1:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  < /opt/MIS_Projects/Quality/quality-sap-seed.sql
```

## Step 3 — Copy the 33,174 sales rows (new)

I will export the full `zfisales_detail` table to a gzipped CSV
(`zfisales_detail.csv.gz`, all columns) and give it to you for download.
On the server:

```bash
gunzip -c zfisales_detail.csv.gz | docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c "\copy public.zfisales_detail FROM STDIN WITH (FORMAT csv, HEADER true)"

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c "select count(*), sum(amount) from zfisales_detail;"
```

Expect 33,174 rows. After that the Net Sales and Management dashboards show
real numbers immediately, without waiting for a SAP sync.

## Step 4 — Fix the middleware .env and start it on 3002

Your current `/opt/MIS_Projects/Quality/middleware/.env` is still the laptop
copy: it listens on 3008 and points at the ngrok tunnel. Three lines change
for the server; the SAP DEV block is already correct.

```text
PORT=3002
APP_BASE_URL=http://10.10.4.165:8081/middleware
MIDDLEWARE_SHARED_SECRET=<long random value, e.g. openssl rand -hex 32>
SAP_TIMEOUT_MS=600000

SAP_DEV_BASE_URL=http://10.10.4.18:8000
SAP_DEV_CLIENT=243
SAP_DEV_USER=SIPL_MOUNIKA
SAP_DEV_PASSWORD=Welcome@7654321
```

Note: `123456` is too weak for a shared secret on a networked server — replace
it, and store the same value in the portal (Administration → SAP API Settings)
so both sides match.

Also make sure `server.mjs` and `package.json` on the server are the current
root `middleware/` versions (v1.2.0, no response truncation), then:

```bash
cd /opt/MIS_Projects/Quality/middleware
npm install --omit=dev
pm2 restart mis-q-middleware || pm2 start server.mjs --name mis-q-middleware
pm2 save
pm2 logs mis-q-middleware --lines 30   # expect: listening on :3002, secret configured
```

## Step 5 — Verify Quality

- Login at `http://10.10.4.165:8081` with `sharvi` / `Welcome@2026`
- Launchpad, Net Sales, Management Dashboard show the imported figures
- Administration → Users / Roles / Permissions / SAP API Settings all open
- SAP API Settings → Middleware → Test Connection succeeds, then run one
  manual sync of `Sales_Reports_KPI`

## Step 6 — Repeat for Production

Same steps, with: frontend built against
`VITE_SUPABASE_URL=http://10.10.4.165:9000/supabase` and the Production **anon**
JWT (never the service_role key in a VITE_ variable); paths under
`/opt/MIS_Projects/Production/...`, containers `mis_p_*`, middleware port 3010,
`APP_BASE_URL=http://10.10.4.165:9000/middleware`; users created with
`SUPABASE_API=http://10.10.4.165:9000/supabase DB_CONTAINER=mis_p_db`.
Never run `docker compose down -v` on either environment.

## Repo changes

- `deploy/quality-sap-seed.sql` — new: SAP system, endpoint, middleware config
  and table mapping rows, with server-appropriate middleware URL/port
- `zfisales_detail.csv.gz` — generated export handed to you for import (not
  committed to the repo)
- `deploy/README.md` — short section describing the two new steps
