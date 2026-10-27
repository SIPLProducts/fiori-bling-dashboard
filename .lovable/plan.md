# Purchase module on Quality/Production + Sharvi Admin permission column

## 1. Purchase module missing on Quality / Production
Locally the Purchase section comes from rows added to the database (section, 3 cards, role grants). Quality and Production use their own databases, so the most likely cause is that `deploy/purchase/install-purchase-module.sql` (and `install-purchase-register.sql`) was not run there, or the new screen files were not deployed. This cannot be checked from here, so the first step is a check script.

- Add `deploy/purchase/check-purchase-module.sql`: shows whether the Purchase section, the 3 cards and their role grants exist. Run it on Quality/Production.
- Make `install-purchase-module.sql` complete and safe to rerun: section + 3 cards + grants for Admin and Sharvi Admin, including the module-level permission `module.mm`.
- Deploy checklist in the reply: run the two SQL files, deploy the Purchase screen files, then sign out and back in (or press Refresh).

## 2. Screen Permissions: Sharvi Admin column
- Signed in as **Sharvi Admin**: the matrix shows a **Sharvi Admin** column (always ticked, locked, since Sharvi Admin always has full access).
- Signed in as **Admin**: no Sharvi Admin column (same as today).

## Technical details
- `permissions.tsx`: filter out `super_admin` only when `!launchpad.isSuperAdmin`; render its cells as checked + disabled.
- SQL uses `WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING`; mirrored as a timestamped file in `supabase/migrations/`.
