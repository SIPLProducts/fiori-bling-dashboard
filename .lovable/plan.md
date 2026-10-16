# Plant / Profit Centre: Select All + why user 51270 sees no data

## Why 51270 sees 0
Checked the database. User 51270 has plants 1000, 1100, 1110 and profit centres COFF100001–COFF100005. The rule is that a record shows only when its plant AND its profit centre are both allowed.
- Open Sales Orders: plant 1100 rows only use PGNLB11001 / PGPED11001. No row has a COFF profit centre. Plants 1000 and 1110 have no rows.
- Net Sales: plant 1100 rows only use PGNLB11001 / PGPED11001 / PGPED11002.
So no record matches both lists, and the empty screens are correct for these settings. Nothing is broken. To give this user data, assign profit centres that really occur under their plants (for example PGNLB11001, PGPED11001), or leave Profit Centre empty, which means all profit centres in their plants.

## Changes
1. Create / Edit User: add **Select All** and **Deselect All** buttons to the Plant and Profit Centre lists. These are the same buttons used in the Smart Filters. Select All applies to every value in the list, and Deselect All clears it. Empty still means "all allowed".
2. Under Profit Centre, add a short hint: "Records must match both a selected plant and a selected profit centre. Leave empty to allow all."

## Technical
- `src/routes/_authenticated/admin/users.tsx`: pass `bulkActions` to the two `MultiSelect`s and add the hint text.
- The access rules and the database stay unchanged.
