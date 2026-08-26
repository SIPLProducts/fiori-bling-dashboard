# SAP API Settings (Admin) + Node.js Middleware

A new Administration screen — **SAP API Settings** — matching the reference screenshots, plus a small Node.js middleware service that actually talks to SAP. No SAP passwords are stored in the portal database; they live only in the middleware's `.env`.

## 1. New admin screen: SAP API Settings

Same shell, header and card styling as the existing Users / Roles / Permissions screens, reachable from the Administration menu, gated by a new permission `admin.sap-api` (Sharvi Admin always).

Three tabs:

### APIs
- Card grid of registered endpoints: name, module badge, auth-type badge, description, Active/Inactive, last-synced time, and Edit / Test / Delete actions.
- **New endpoint** opens a detail view with tabs (Details, Request, Response, Credentials, Scheduler, Connectivity) and a **Test connection** button, as in the screenshot:
  - Details: name, module (Common + SD/FI/CO/PP/QM/PS), description, endpoint path or full URL, SAP system, HTTP method, auth type (Basic via middleware / Proxy / None), active flag.
  - Request: query params and headers (key/value rows), request body template.
  - Response: root/records path, field mapping notes, sample response viewer from the last test.
  - Credentials: shows which SAP system supplies the technical user; states plainly that passwords are held in the middleware environment, not in the portal.
  - Scheduler: enable, interval/cron expression, last run and last status (stored only; no background runner in this phase).
  - Connectivity: resolved final URL preview, last test status, response time and error text.

### SAP Systems
- Environment (DEV / QUALITY / PROD), Base URL, SAP client, technical username, plus a read-only "password managed in middleware" indicator.
- Add another system, mark one as active; relative endpoint paths inherit the active system's base URL.
- **Test connection** calls the middleware.

### Middleware Configuration
- Connection mode (Direct / Via proxy server), deployment mode, middleware port, Node.js middleware URL, and a read-only indicator that the proxy secret lives in the middleware `.env`.
- **Test middleware** pings the service and shows version/uptime/SAP reachability.

## 2. Node.js middleware service (new, in the repo)

`deploy/middleware/` — a small Express service, containerised alongside the other deploy assets:
- `GET /health` — version, uptime.
- `POST /sap/test` — resolves a system + path, performs a HEAD/GET against SAP, returns status and timing.
- `POST /sap/call` — generic proxy: method, path, query, headers, body; adds SAP basic auth and `sap-client`, returns the raw payload.
- Auth: every request must carry the caller's portal access token; the middleware verifies it with the Supabase JWT secret from its own `.env` and rejects anything else. CORS restricted to the portal origins.
- `.env.example` with SAP base URLs, technical user + password per environment, JWT secret, allowed origins, port. `README.md` with run/deploy steps and an nginx snippet.

## 3. Where data lives

Portal database (new tables, Sharvi-Admin-only access): `sap_systems`, `sap_endpoints`, `sap_middleware_config`. These hold only non-secret configuration — URLs, paths, methods, headers, mappings, schedules, last-test results. No passwords or secrets in any of them.

## 4. Scope of this phase

Settings screens + Test connection only. Existing reports keep using the current sample dataset; once endpoints test green they can be wired up in a follow-up.

## Technical notes
- Route `src/routes/_authenticated/admin/sap-api.tsx`; data access in `src/lib/sap-api.functions.ts` (browser Supabase client, super-admin guard like `admin.functions.ts`).
- New screen key `admin.sap-api` added to `src/lib/screens.ts` so it appears in the Screen Permissions matrix, plus nav entry in `src/lib/nav.ts`.
- Migration creates the three tables with GRANTs and RLS policies scoped through `is_super_admin(auth.uid())`.
- Test actions `fetch` the configured middleware URL from the browser with the current session's bearer token.
