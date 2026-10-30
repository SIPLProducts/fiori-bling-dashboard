## Plant Analytics bars: show only the Short Name

**Change**
- Under each bar in Plant Analytics (Purchase Register), show only the Short Name (for example "TMK"). The plant code line is removed.
- If a plant has no Short Name, show the plant code under that bar so it is never blank.
- The table below stays as it is: Plant Code, Plant Name, Short Name, Amount.
- PDF and Excel downloads keep their current layout.

**Technical details**
- In `src/components/purchase-register-dashboard.tsx`, the two-line custom XAxis tick becomes a single line: `plantInfo.get(code)?.sh || code`. The axis height drops back to the normal size.
- After the change, deploy the frontend to Quality (git pull, bun run build, reload nginx).
