# User dialog: Info fields, password beside Role, visual polish

## What changes

1. **Two new fields: Info 1 and Info 2**
   - Placed in the Identity row right after Email, so the row reads: Email, Info 1, Info 2.
   - Optional free-text fields, placeholders "Enter Info 1" / "Enter Info 2".
   - Saved with the user and shown when editing.

2. **Password beside Role**
   - The separate "Password" section is merged into the Access section.
   - One row: Role *, Password, Confirm Password (3 columns).
   - Strength meter and match hint stay under their fields; on edit the fields stay optional ("leave blank to keep current password") with that hint shown under the section title.

3. **Aesthetic pass on the dialog and table**
   - Dialog: gradient header strip with the user's initials avatar when editing, section headers as small uppercase labels with a divider rule, consistent 3-column grid with even gaps, sticky footer with Cancel / Save and a saving spinner.
   - Inputs: subtle focus ring in the primary colour, required markers in a muted accent instead of plain asterisks colour.
   - Table: rounded card, softer header, hover highlight, status badge with dot, aligned action button — same labels as today.
   - All colours from existing semantic tokens, Fiori theme untouched.

## Technical notes

- Migration: add nullable `info1` and `info2` text columns to `public.profiles`.
- `src/lib/admin.functions.ts`: add `info1` / `info2` to `PortalUser`, `UserFormInput`, the profile select and the create/update payloads (no new validation — both optional).
- `src/routes/_authenticated/admin/users.tsx`: add the two fields after Email, move password fields into the Access section grid, restyle dialog header/sections/footer and the table shell.
- No changes to roles, permissions or login.
