# Remove extra space after date-picker icon in SAP API Settings

## Change
In `src/routes/_authenticated/admin/sap-api.tsx`, on the **Request** tab, the two posting-date inputs (`Posting From Date` and `Posting To Date`) currently show browser-default spacing to the right of the built-in calendar icon. Remove that trailing space so the icon sits flush against the right edge of the input and the field looks tighter.

## Implementation
- Add a small CSS override (e.g. `pr-1` or a targeted `[type="date"]` rule) to the two `Input type="date"` fields inside the Posting date grid, or to the `Field` wrapper, so the calendar icon no longer reserves extra padding after it.
- Keep all existing behavior: date values still sync to `BUDAT_F`/`BUDAT_T` in the payload, defaults remain unchanged, and the pickers stay editable.

## Verification
- Open **Administration → SAP API Settings → any endpoint → Request tab**.
- Confirm the calendar icon in both Posting From / Posting To inputs no longer has visible trailing space.
- Confirm date selection still updates the payload and the inputs pre-fill correctly.