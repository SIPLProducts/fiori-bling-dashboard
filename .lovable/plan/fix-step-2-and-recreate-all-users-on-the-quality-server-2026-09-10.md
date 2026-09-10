# Fix Step 2 and recreate all users on the Quality server

Two things to settle:

**Nginx: no changes needed for Quality.** The repo's
`deploy/nginx/mis-quality.conf` already proxies `/middleware/` on port 8081 to
`127.0.0.1:3002`, exactly as the deployment needs. Leave it untouched.

**The migration error.** `type "app_role" already exists` plus 7 tables in
`public` means the earlier attempt got partway through the very first migration
and stopped. The database is half-initialised, so the loop can never restart
cleanly until that partial state is cleared.

## Step 1 — See exactly what the partial run left behind

```bash
cd /opt/MIS_Projects/Quality/backend
set -a; source .env; set +a

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select tablename from pg_tables where schemaname='public' order by 1;"
```

Expect names like `profiles`, `user_roles`, `user_role_assignments`, `roles`,
`role_screens`, `tiles`, `tile_groups` — the first migration's tables, with no
data in them.

## Step 2 — Reset the public schema and re-run every migration

Since there is no real data yet, the clean fix is to drop and recreate the
`public` schema, then run the whole migration set from the start. Auth users
live in the `auth` schema and are **not** affected.

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO supabase_admin, postgres;
SQL

for f in $(ls /opt/MIS_Projects/Quality/supabase/migrations/*.sql | sort); do
  echo "==> $(basename $f)"
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$f" || break
done
```

Verify it completed:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c \
  "select count(*) from zfisales_detail; select key from roles order by sort_order;"
```

## Step 3 — Create all five users on the server

These are the accounts currently in the hosted system, to be recreated
identically on Quality:

| Name | Email | Username | Contact | Plant | Department | Role |
|---|---|---|---|---|---|---|
| sharvi admin | masteradmin@sharviinfotech.com | sharvi | 9090909090 | — | — | Sharvi Admin |
| Bhavani Shankar Anupindi | abshankar@hbl.in | 44195 | 9393012944 | — | IT Application | Admin |
| Ram Koti | koti@hbl.in | 51270 | 9898989898 | 1600 | Sales | User |
| Sunil Kumar Akula | sunilkumar@sharviinfotech.com | 0056 | 7989328372 | 1600 | Devloper | User |
| Demo User | demo@nexus-portal.app | — | — | — | — | Sharvi Admin |

Passwords cannot be exported from the hosted system, so each account gets a
temporary password on the server that the user changes after first login.

Two sub-steps per user:

1. **Create the Auth account** (same command style that already worked for
   `sharvi.admin@siplproducts.com`), via the Quality Auth admin endpoint on
   port 8081, with `email_confirm: true` and a temporary password.
2. **Fill in the profile and role**, since the trigger only sets defaults:

```sql
UPDATE public.profiles SET
  username='sharvi', first_name='sharvi', last_name='admin',
  contact='9090909090', status='active'
WHERE email='masteradmin@sharviinfotech.com';

INSERT INTO public.user_role_assignments (user_id, role_key)
SELECT id,'super_admin' FROM auth.users WHERE email='masteradmin@sharviinfotech.com'
ON CONFLICT DO NOTHING;
```
…repeated per user with their own values and role key
(`super_admin` / `admin` / `user`).

The plan will supply the complete ready-to-paste script for all five accounts,
including the already-created `sharvi.admin@siplproducts.com` account, so it is
one copy-paste on the server.

Simpler alternative for the last four: create only Sharvi Admin by script, log
into the portal at `http://10.10.4.165:8081`, and add the rest through
**Administration → User Management**, which fills profiles and roles for you.

## Step 4 — Continue with the approved deployment plan

- Install the middleware from the root `middleware/` folder on port 3002 with PM2
- Verify login, launchpad, Net Sales, Management Dashboard, SAP API Settings
- Then repeat everything for Production (port 9000, anon key, middleware 3010)

## Repo changes

None — server-side procedure only.
