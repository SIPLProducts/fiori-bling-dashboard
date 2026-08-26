# User Management, Roles & Screen Permissions

## What you get

**1. Users tab (rebuilt)**
Create User popup with: Username, First Name*, Last Name*, Email*, Contact*, Status* (Active/Inactive), Employee ID, Department, Password*, Confirm Password*, Role (multi-select from the Roles tab).
- Validation: required fields, unique username, valid email, password match + minimum length.
- Admin sets the password directly; the new user can sign in immediately.
- User list shows name, username, email, contact, department, status and assigned roles, with edit (fields + roles + status) and deactivate.
- Inactive users are blocked at login.

**2. Roles tab (new)**
Create/rename/delete roles with a description. Seeded with: Super Admin (Sharvi Admin), Admin, Buyer, Approver, Viewer.
- Super Admin is a protected system role: only users who hold it can see the Roles tab, the Screen Permissions tab, or grant Super Admin. It always has full access and cannot be edited, deleted, or stripped from the last remaining Super Admin.
- Admin sees only what its screen permissions allow.

**3. Screen Permissions tab (new)**
Matrix of roles x screens (Launchpad, Procurement, Purchase Orders, Suppliers, Sales Analytics, each SAP module report, Users, Roles, Screen Permissions). Toggle a checkbox to grant a screen to a role. Permissions are per role; a user's access is the union of their roles' screens.

**4. Login**
Single "Email or Username" field plus password. A username is resolved to the account email server-side without exposing any email addresses publicly. After login the app loads the user's roles and permitted screens; the navbar, launchpad tiles and every route are filtered by those permissions, and a direct URL to an unpermitted screen shows Access Denied.

## Technical notes

Database (one migration):
- `roles` (key, name, description, is_system) and `role_screens` (role_key, screen_key) replacing the hardcoded `app_role` checks; `user_roles` gains a `role_key` text column mapped to `roles` so existing admin/buyer/approver/viewer assignments carry over.
- `profiles` gains username (unique, case-insensitive), first_name, last_name, contact, employee_id, department, status.
- Security-definer functions: `has_screen(_user_id, _screen)`, `is_super_admin(_user_id)`, `resolve_login_email(_identifier)`.
- RLS: everyone authenticated reads roles/role_screens/own profile; only Super Admin writes roles, role_screens and other users' data. GRANTs for authenticated + service_role on every new table.

App:
- `src/lib/screens.ts` — screen registry shared by nav, launchpad and route guards.
- `src/lib/admin.functions.ts` — user create/update/deactivate and role/permission mutations go through `createServerFn` with the service-role client (Auth Admin API is required to set a password for another user), each verifying Super Admin server-side first.
- New routes `/_authenticated/admin/roles` and `/_authenticated/admin/permissions`; `/_authenticated/admin/users` rewritten with the create/edit dialog.
- `src/routes/auth.tsx` — identifier field calling the resolve function before `signInWithPassword`.
- Nav and launchpad tile filtering switch from role lists to permitted screens.

Deployment note: admin user creation needs the trusted server path, so on your self-hosted server the app must run as the Node/app container again (the pure static `dist` served by Nginx alone cannot create users). Everything else works unchanged.
