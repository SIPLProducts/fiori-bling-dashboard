# Report headers + User Management form changes

## 1. Report page headers (Sales Distribution screens)

- Remove the `· ZFISALES_MIS` style suffix from the page heading.
- Show the screen name large (as the normal page title) and the T-code as small muted text directly below it.
- Applies to all three SD screens: Sales report KPI (ZFISALES_MIS), Sales report for Finance and GST (ZVF05_FIN_N), Sales Register report (ZVF05_SAL).
- The nav dropdown already shows name + small T-code and stays as-is.

## 2. User Management create/edit dialog

- Layout: fields arranged **3 per row** (stacking to 1 column on small screens).
- New fields: **Plant**, **Purchase Group**, **Distribution Channel**.
- Removed field: **Employee ID** (also removed from the users table column list).
- **Username becomes mandatory** (marked with *, validated on create; still read-only when editing).
- Every input gets a placeholder in the form `Enter First Name`, `Enter Username`, `Enter Plant`, etc.; dropdowns keep `Select ...` placeholders.
- Users table: Employee ID column replaced by Plant; Purchase Group and Distribution Channel are visible in the dialog only (keeps the table readable).

## Technical notes

- Migration on `public.profiles`: add `plant text`, `purchase_group text`, `distribution_channel text`. `employee_id` stays in the database (unused) so no data is destroyed; it is simply dropped from the UI and from the form payload.
- `src/lib/admin.functions.ts`: extend `PortalUser` / `UserFormInput` with the three new fields, drop `employee_id` from create/update writes and select list, and make username required in `validate()` (keeps the existing format check).
- `src/routes/_authenticated/admin/users.tsx`: `Section` grid becomes `sm:grid-cols-2 lg:grid-cols-3`, dialog widened to `sm:max-w-3xl`, new inputs added under Contact & organisation, placeholders added everywhere, Employee ID removed from form/table/search.
- `src/components/report-shell.tsx`: `ReportShell` gains an optional `tcode` prop rendered as small muted text under the title; SD routes pass `DEF.title` + `DEF.tcode` instead of concatenating them.
