# Refine Sales PDF branding and reorganize module screens

## Naming standard
Use **Title Case** for screen names because it is the clearest enterprise UI convention:
- Net Sales
- Dispatches
- Order Book
- Open Sales Orders
- TBN
- Cash Flow
- Asset Register

## Sales PDF
- Remove **“HBL MIS Enterprise Portal — Sales Analytics”** from the repeated PDF header.
- Keep the HBL logo at the top-left of every PDF page and show **“HBL Engineering Limited”** directly below it.
- Keep the selected date range at the top-right and retain the existing confidentiality footer and page numbering.
- Add **“Sales Dashboard”** at the left of the same PDF row that contains **All, Domestic, Services, and Exports**, before those tabs.
- Keep the normal on-screen dashboard layout unchanged unless a label is part of the requested Net Sales rename.
- Preserve page-safe A4 landscape pagination and the existing PDF exclusions.

## Rename Total Sales to Net Sales
- Replace user-facing **Total Sales** labels with **Net Sales** across the portal, including the Sales Dashboard summary card, launchpad card, drill-down labels, Management Dashboard labels/insight wording, and related accessible labels.
- Keep existing working URLs and permission keys stable where possible, avoiding broken bookmarks or lost role access.

## Sales & Distribution module
Show screens in this order:
1. Net Sales — existing live Sales Dashboard.
2. Dispatches — new coming-soon screen.
3. Order Book — new coming-soon screen.
4. Open Sales Orders — existing dashboard.

Add dedicated role permissions, launchpad tiles, routes, and route-level access checks for Dispatches and Order Book. Existing roles with Sales & Distribution access will inherit the new screen permissions during migration so current users are not unexpectedly blocked.

## Financial Accounting module
Replace the visible module screen list with this order:
1. TBN — existing live dashboard.
2. Cash Flow — new coming-soon screen.
3. Asset Register — new coming-soon screen.

Remove the obsolete Financial Accounting entries from the visible permission hierarchy and launchpad. Add dedicated permissions, tiles, routes, and access checks for Cash Flow and Asset Register. Existing Financial Accounting users will inherit access during migration.

## Coming-soon pages
Each new screen will open a real protected page using the portal shell, with its screen name, module context, and a concise “Coming soon” state. Each route will include unique page metadata and can later be replaced by its live report without changing the tile URL or permission key.

## Data and deployment
- Add one idempotent database migration to rename/reorder existing tiles, create the four new tiles, migrate role permissions, and retire superseded Financial Accounting tile assignments.
- Update the self-hosted alignment SQL so Quality and Production remain consistent with the application.
- Do not change SAP synchronization or Sales calculations.

## Verification
- Confirm the Sales PDF header and tab row on every generated page, with no clipping or regressions.
- Confirm all requested Net Sales labels are renamed.
- Confirm both modules show exactly the requested screens in the requested order.
- Confirm every tile opens its intended dashboard or coming-soon page and direct links enforce its permission.
- Confirm Screen Permissions displays the new hierarchy and parent selection covers all children.
- Run focused tests, type checks, and a desktop preview walkthrough.
