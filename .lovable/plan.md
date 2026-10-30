# Show PLANT_SH in Plant Analytics

## Why it shows "-" right now
The screen already has a place for PLANT_SH, under each bar and in its own table column. It shows "-" because none of the stored purchase lines have a PLANT_SH value. I checked all 3,771 lines in this database: none has PLANT_SH, either in the saved value or in the original SAP data. Those lines were synced before SAP started sending PLANT_SH, or by an older version of the sync program.

## Steps
1. **Sync program on the server:** copy the latest sync program to Quality and Production and restart it, so new syncs save PLANT_SH.
2. **Re-sync Purchase Register** on each server. Matching lines get updated with their PLANT_SH value.
3. **Backup when PLANT_SH is missing:** if a plant has no PLANT_SH, the bar label and the PLANT_SH column use that plant's short name from any other line of the same plant (already built in). Otherwise they show "-". No invented values.
4. **Check:** after the sync, the bars read "1300 / TMK" and the table shows PLANT_SH next to Plant Name.

## Technical details
- Server check, run in the middleware folder: `node -e 'import("./sync-core.mjs").then(m=>console.log(m.mapPurchaseRegisterPayload([{BELNR:"1",PLANT_SH:"VZM"}],"PR").rows[0]?.plant_sh))'` should print `VZM`.
- Then `pm2 restart mis-q-middleware` / `mis-p-middleware`, then use Sync on the Purchase Register screen.
- Optional backfill from saved SAP data: `update purchase_register set plant_sh = raw->>'PLANT_SH' where coalesce(plant_sh,'')='' and raw ? 'PLANT_SH';`
- No screen code changes are needed. The display already reads `plant_sh`.
