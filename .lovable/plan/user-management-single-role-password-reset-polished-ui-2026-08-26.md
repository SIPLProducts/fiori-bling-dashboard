# User Management: single role, password reset, polished UI

## What changes

1. **One role per user**
   - The Role field in the Create/Edit User dialog becomes a single-select dropdown (choose exactly one role), replacing the checkbox list.
   - Role is required. Saving a user replaces whatever role they had with the selected one, so nobody can end up with two roles.
   - Only roles the current admin is allowed to grant appear in the dropdown (Sharvi Admin stays visible only to Sharvi Admins).

2. **Password on edit**
   - The Edit User dialog gets optional Password / Confirm Password fields: leave blank to keep the current password, fill both to reset it.
   - Same validation as create (match + minimum length), with a clear inline error.

3. **Status as plain text, not a toggle**
   - In the users table, Status shows a coloured badge reading Active or Inactive — no switch.
   - Status is changed only inside the user dialog (Status dropdown), keeping one editing path.

4. **Aesthetic refresh of the table and dialog**
   - Table: card container with header, search box, cleaner column layout (Name + email stacked, Username, Department, Role badge, Status badge, Actions), zebra-free subtle row hover, right-aligned action buttons, empty state.
   - Dialog: two-column responsive field grid, grouped sections (Identity, Contact & Org, Access, Password), consistent spacing, sticky footer with Cancel / Save.
   - All colours come from existing semantic tokens so the Fiori theme stays intact.

## Technical notes

- `src/routes/_authenticated/admin/users.tsx`: replace role checkboxes with a `Select`, drop the `Switch`-based status cell for a `Badge`, add password fields to the edit path, restructure the table + dialog markup.
- `src/lib/admin.functions.ts`: `createPortalUser` / `updatePortalUser` accept a single `roleKey` (still validated against assignable roles and written through the existing replace-assignments path, which already deletes prior rows); `updatePortalUser` gains an optional password update via the admin auth client. `setUserStatus` stays for internal use by the dialog save path.
- No database migration needed: `user_role_assignments` keeps its shape, we simply never write more than one row per user.
