# Production ANON / SERVICE_ROLE keys

Generated as HS256 JWTs signed with the production `JWT_SECRET` you supplied
(10-year expiry, `iss: supabase`). Paste these into
`/opt/MIS_Projects/Production/backend/.env`.

## Keys

ANON_KEY

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg3NTYwNzA0LCJleHAiOjIxMDI5MjA3MDR9.zPlqhkVrG7i4iBRIx-k6oHF0n7_Sc_ra5crWOa2R68k
```

SERVICE_ROLE_KEY

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODc1NjA3MDQsImV4cCI6MjEwMjkyMDcwNH0.W8NKY5APMwETPG9-akrqj7Lab7l0vs1-p_09LKQOtLU
```

## .env lines to set

```
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg3NTYwNzA0LCJleHAiOjIxMDI5MjA3MDR9.zPlqhkVrG7i4iBRIx-k6oHF0n7_Sc_ra5crWOa2R68k
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODc1NjA3MDQsImV4cCI6MjEwMjkyMDcwNH0.W8NKY5APMwETPG9-akrqj7Lab7l0vs1-p_09LKQOtLU
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg3NTYwNzA0LCJleHAiOjIxMDI5MjA3MDR9.zPlqhkVrG7i4iBRIx-k6oHF0n7_Sc_ra5crWOa2R68k
```

`VITE_SUPABASE_PUBLISHABLE_KEY` must equal `ANON_KEY` — the browser bundle uses it.
`SERVICE_ROLE_KEY` bypasses RLS: server-side only, never in the frontend build.

## Rules that apply

- These keys are valid only while `JWT_SECRET` stays exactly as it is now.
  Changing `JWT_SECRET` invalidates both keys and requires regenerating them.
- Also required in the same `.env`: `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`
  (Studio basic auth), `SITE_URL`, `API_EXTERNAL_URL`.
- Before the first `up -d`, copy `deploy/docker/supabase/kong.yml` into
  `/opt/MIS_Projects/Production/backend/supabase/kong.yml`, otherwise Docker
  creates it as a directory and Kong crash-loops.

## Apply on the server

```bash
cd /opt/MIS_Projects/Production/backend
nano .env                       # paste the three lines above
grep -c 'change-me' .env        # must print 0
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate kong rest auth storage studio
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/   # 200 or 401
```

No application code changes.
