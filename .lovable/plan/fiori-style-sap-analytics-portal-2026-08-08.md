# Fiori-Style SAP Analytics Portal

A launchpad-style portal for your customers: sign in, see role-based tile groups, drill into analytics reports. Built on realistic mock SAP data now, with the data layer shaped so live SAP APIs plug in later without rebuilding the UI.

## What gets built

### 1. Launchpad home (`/`)
- Shell bar: logo, global search, notifications, help, user avatar menu.
- Horizontal group tabs like your reference: Purchase Requisition Processing, Supplier Evaluation, Procurement Overview, Workflow, Purchase Order Processing, Purchase Contract Processing.
- Tile grid per group with three tile types:
  - Launch tile (title, subtitle, icon)
  - KPI tile (big number, unit, footer e.g. "Overdue")
  - Micro-chart tile (sparkline / bar trend)
- Only tiles allowed by the signed-in user's role are rendered.

### 2. Analytics report pages
Drill-down pages reached from tiles:
- **Procurement Overview** — KPI strip, spend-over-time line chart, spend-by-category donut, top suppliers bar chart.
- **Purchase Order Items** — filter bar (date range, supplier, plant, status), sortable/paginated data table, export to CSV, status chips.
- **Supplier Evaluation** — supplier scorecard cards plus a comparison chart.
Each report has a Fiori-style object header, filter bar, and content area.

### 3. Auth and roles
- Lovable Cloud enabled for accounts, sessions, and role storage.
- Email + password sign-in, plus Google sign-in.
- `profiles` table (display name, company, avatar) auto-created on signup.
- Separate `user_roles` table with roles: `admin`, `buyer`, `approver`, `viewer` — never stored on the profile, checked through a security-definer `has_role` function used by RLS policies.
- Tile and report visibility driven by role; server-side checks back up the UI hiding.
- Admin-only "Users & Roles" page to assign roles.

### 4. SAP integration seam (mock now, live later)
- All report data flows through server functions in `src/lib/sap.functions.ts`.
- Each function has one switch: mock provider (deterministic generated dataset) or SAP provider (OData fetch).
- SAP provider stubs are written against OData v2/v4 entity sets (`A_PurchaseOrder`, `A_Supplier`, etc.) with pagination and `$filter` mapping, but stay inactive until credentials are supplied.
- When you're ready: save the SAP base URL and service credentials as secrets, flip the provider flag — no UI changes.

## Design
Fiori-inspired but modernized: SAP-blue shell bar, white tile cards on a soft grey canvas, 0.5rem radius, restrained shadows, dense information layout, clear numeric hierarchy for KPIs. All colors as semantic tokens in `src/styles.css` with light/dark support.

## Technical notes
- TanStack Start routes: public `/` landing-aware index, `/auth`, and gated pages under `_authenticated/` (`/launchpad`, `/reports/*`, `/admin/users`).
- Charts with Recharts; tables with TanStack Table.
- Tile catalog and group definitions stored in the database so tiles can be added or reordered without a code change; seeded via migration with the groups and tiles from the reference screen.
- Report data fetched in components via `useServerFn` + React Query (protected functions are never called from public loaders).
- Mock data is deterministic and realistic (12 months of spend, ~500 PO line items, 20 suppliers).

## Not in this phase
- Live SAP connection (stubs ready, activated once endpoint and credentials exist).
- Writing back to SAP (create/change PO) — read-only analytics for now.
