# Create / Edit User form: reorder fields and add Profit Centre dropdown

## Layout changes

**Basic details section**
- First Name, Last Name, Username, Email, **Contact \*** (moved here, right after Email), Info 1.
- **Info 2 removed** from the form (existing saved values are kept untouched in the database, just no longer shown/edited).

**Contact & organisation section** (new order)
1. Plant (existing SAP dropdown)
2. **Profit Centre** (new SAP dropdown)
3. Department
4. Purchase Group
5. Distribution Channel
6. Status \*

## Profit Centre dropdown
- Lists the 157 profit centres already synced from SAP, shown as "code — name", same look and behaviour as Plant.
- If a user's saved profit centre is no longer in the SAP list, it still shows so nothing is lost; if the list is empty, it falls back to a text box.
- The choice is saved on the user record and loaded when editing.

## Keeping Quality and Production in step
- One new optional column on the user profile for the profit centre (additive, existing users show blank).
- Recorded as a timestamped migration in `supabase/migrations/` plus a short script under `deploy/user-dropdowns/` for Quality and Production.

## Technical notes
- Column: `public.profiles.profit_center text` nullable.
- Read via `sap_user_dropdown_masters` where `category = 'profit_center'`, reusing the Plant query helper and `dropdownLabel`.
- Save path: include `profit_center` in the admin create/update user server functions alongside `plant`.
- Small test that profit-centre options come from the right category and labels combine code and name.
