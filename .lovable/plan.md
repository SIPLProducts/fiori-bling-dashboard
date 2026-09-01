# Fix: launchpad shows no tiles for some roles

## What I found

Tile visibility today is decided by two different, unconnected systems:

1. Module groups (Sales & Distribution, FI, CO, PP, QM, PS) are shown only if the user's role has the matching `module.*` screen ticked.
2. All other groups (Procurement Overview, Purchase Order, Purchase Requisition, Purchase Contract, Supplier Evaluation, Workflow, Tables Master) ignore Screen Permissions completely and instead compare the user's role key against a legacy list stored on each tile (`admin`, `buyer`, `approver`, `viewer`).

Any role whose key is not one of those four legacy names (for example a custom role like `user`) matches nothing in group 2, and if it also has no `module.*` screens ticked it matches nothing in group 1 either — the launchpad renders completely empty, exactly as in the screenshot, even though Screen Permissions look correct.

Verified for the account in the screenshot (abshankar@hbl.in): it currently holds the `admin` role, can read all 59 tiles, 13 groups and 18 granted screens, and the launchpad now renders every tab in preview. So the blank screen came from the role/permission state at that time — and the same blank screen will return for any role outside the four legacy names.

Also: the launchpad result is cached for 60 seconds and is not refreshed when an administrator changes a role or its screens, so a user can keep seeing the old (empty) launchpad until a hard reload.

## What will change

Confirmed behaviour: tiles follow Screen Permissions only — no role is hard-coded to see everything except Sharvi Admin.

1. Give every tile group a screen key, including the procurement-side groups that have none today (Procurement Overview, Purchase Order Processing, Purchase Requisition, Purchase Contract, Supplier Evaluation, Workflow, Tables Master). These appear in the Screen Permissions tab so they can be ticked per role.
2. Tile visibility becomes a single rule: show a tile when the user's effective screens include the tile's screen. Drop the legacy `allowed_roles` fallback so custom roles behave the same as built-in ones. Sharvi Admin keeps full access.
3. Backfill the existing roles so nothing is silently lost: the `admin` role gets the new procurement/tables screens granted, and any role that already has a module screen keeps it. Existing per-role tick boxes are otherwise untouched.
4. When a user has a role but zero granted screens, show a clear message ("Your role has no screens assigned yet — ask an administrator") instead of an empty page.
5. Refresh the launchpad cache after role or screen-permission changes and on sign-in, so a permission change takes effect without a manual reload.

## Technical notes

- `src/lib/screens.ts`: add screen keys for the non-module tile groups.
- `src/lib/sap.functions.ts` (`getLaunchpad`): map every `tile_groups.key` to a screen key and filter tiles purely on `screens.includes(...)`; keep the super-admin bypass.
- Migration: insert the new `role_screens` rows for the `admin` role (and any role that should retain its current visibility).
- `src/routes/_authenticated/launchpad.tsx`: empty-state message for "role has no screens".
- Invalidate the `["launchpad"]` query after saving roles / screen permissions.
- The published site (mis.siplproducts.com) will only pick this up after a republish.
