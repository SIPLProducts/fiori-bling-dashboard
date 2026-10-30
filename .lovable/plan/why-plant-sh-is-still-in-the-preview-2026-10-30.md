# Why PLANT_SH is still "-" in the preview

## What I found
- The screen is ready: the label under each bar and the PLANT_SH column both read the saved PLANT_SH value.
- The preview database has 3,771 Purchase Register lines. None of them has PLANT_SH, either in the saved column or in the original SAP data saved with each line.
- The original SAP data for these lines has every other field (WERKS, NAME1_WER, NET_AMT and so on), but no PLANT_SH key. So the SAP system the preview syncs from did not send PLANT_SH. The last sync was at 6:38 pm IST today and it succeeded.
- The app cannot show a value that SAP never sent. Nothing is being dropped while saving: I tested the save step with a sample line containing PLANT_SH = "VZM" and it saved "VZM".

## Steps
0. **Rename column:** in the Plant Analytics table, rename the "PLANT_SH" column header to "Short Name".
1. **SAP side (your team):** confirm the Purchase Register API on the SAP system used for the preview (same SAP client and endpoint URL as in SAP API Settings) now returns `PLANT_SH`. Its new field may be on a different client or not transported yet.
2. **Re-sync:** once SAP returns it, click **Sync** on Purchase Register. Matching lines are updated and PLANT_SH appears under the bars and in the table.
3. **Check:** I query the database again to confirm PLANT_SH is filled, then check the screen.

## Optional while waiting
If you want a short name now, I can add a small fixed list of short names per plant code that is used only when SAP has not sent PLANT_SH. You would need to give me the list (for example 1600 = VZM).
