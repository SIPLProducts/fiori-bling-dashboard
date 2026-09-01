# Show all sync timestamps in Indian time (IST)

## What's happening
The database stores timestamps in UTC (the correct, standard practice). The Database viewer in Lovable Cloud always shows the raw UTC value (05:23 UTC = 10:53 IST) — that viewer cannot be changed. The fix is to make every timestamp shown **inside the app** explicitly render in IST with Indian date format, regardless of the viewer's device timezone.

## Changes

1. **New shared formatter** — `src/lib/format.ts`:
   - `formatDateTimeIST(value)` → `dd-mm-yyyy, hh:mm a` (12-hour, Asia/Kolkata), e.g. `01-09-2026, 11:17 am`
   - Returns an em dash for empty values.
   - Uses `Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })` so it shows IST even on devices set to other timezones.

2. **Apply the formatter everywhere a timestamp is shown:**
   - `src/routes/_authenticated/admin/sap-api.tsx` — sync run times (Scheduler health tab), "Synced …" on endpoint cards, last test times for systems and middleware config.
   - `src/routes/_authenticated/tables/$tableKey.tsx` — "Last sync" stat on the Table Master config screen (replace the current locale-dependent formatter).
   - Any other `new Date(...).toLocaleString()` display of DB timestamps found during the edit.

3. **Labels** — where a sync time is shown, append "IST" (e.g. `Synced 01-09-2026, 11:17 am IST`) so it is unambiguous.

## What does NOT change
- Data stays stored in UTC in the database (best practice; nothing to migrate).
- The Lovable Cloud Database viewer will still show UTC — that's the raw storage view, not the app. The app screens will show IST.

## Verification
- Open SAP API Settings → Scheduler health and Table Master → ZFISALES_DETAIL; confirm times show in `dd-mm-yyyy, hh:mm am/pm IST` matching the actual sync moment.
