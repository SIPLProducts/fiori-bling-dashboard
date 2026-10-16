# Profit Centre field on User Management

## Where the SAP data lives

The `Get_User_Management_Dropdown_RES` API writes into one table: **`sap_user_dropdown_masters`**.

- Search for that name in the Database section to see the rows — it is not named after the API, which is why it was easy to miss.
- It currently holds **36 plants** and **157 profit centres**, last refreshed 10:20 Calcutta.
- Plants are already used: the Plant field on the Add/Edit user form is a dropdown fed from this table.
- Profit centres are stored but nothing reads them yet — there is no Profit Centre field on the user form, and the user record has nowhere to keep the choice.

## What to build

1. **Store the choice on the user record.** Add a single optional text column to the user profile table for the profit centre code. Existing users are untouched and keep showing a blank until one is picked.

2. **Add the field to the Add / Edit user form.** A searchable dropdown next to the Plant field, listing entries as "COFF100001 — Corporate Office" style labels (code — name), read from the same table. It behaves like the Plant dropdown: if a saved value is no longer in the SAP list, it still shows so nothing is lost.

3. **Show it in the user list and use it in searches**, the same way Plant is shown and searched today.

4. **Keep Quality and Production in step.** The column change is recorded as a timestamped migration in `supabase/migrations/` and mirrored by a short script under `deploy/` so the same column can be added on those servers with one command, as done for previous tables.

5. **Tests.** A small check that the profit centre list is read from the right category and that labels combine code and name correctly, alongside the existing dropdown tests.

## Technical notes

- New column: `public.profiles.profit_center text` (nullable, additive — no renames or drops).
- Read path: `supabase.from("sap_user_dropdown_masters").select("code, name").eq("category", "profit_center").order("code")`, sharing the existing query helper and `dropdownLabel` formatter used by Plant.
- The table already grants read access to signed-in users and has a read policy, so no permission changes are needed.
- No sync or SAP changes — the API already populates both categories on its daily 05:30 IST schedule and on manual Sync Now.

## Open question

Should the profit centre also appear as a column in the user list table, or only inside the Add/Edit form? The plan assumes it appears in both; say the word if you want it in the form only.
