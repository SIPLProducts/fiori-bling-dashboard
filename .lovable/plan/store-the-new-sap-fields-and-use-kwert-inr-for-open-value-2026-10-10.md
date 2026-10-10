# Store the new SAP fields and use KWERT_INR for Open Value

## SAP response and storage
- Add separate stored fields for **KWERT_INR** (numeric rupee amount) and **LD_STATUS** (text, accepting the spelling LD_Status as well).
- Preserve every field supplied by SAP in the complete saved response. The uploaded sample contains **three complete records with 124 keys each**; repair only its trailing comma and missing closing bracket to save valid sample JSON.
- Update the existing **Open _Sales _Orders** entry in SAP API Settings with this sample response, without changing its URL, credentials, request dates or schedule. Do not import the sample as live report data.
- Compare the new response keys with existing mappings and field definitions. Remove retired keys from active mappings/settings; leave unused database columns in place and mark confirmed retired business fields deprecated to avoid breaking deployed versions. Keep internal identity and synchronization fields.

## Open Value change
- Replace NETWR with **KWERT_INR** as the source for the **Open Order Value** tile and the detailed-table **Open Value (₹ Cr)** column.
- Use the same source for value totals, charts, rankings, launchpad summaries, Excel and PDF so they reconcile.
- Store the original rupee amount and divide by **10,000,000** only for Crore display. Do not multiply by quantities or fall back to NETWR/P_VALUE1.
- Preserve LD_STATUS exactly as SAP supplies it: **"N" stays "N" and "Y" stays "Y"**. Do not convert it to a boolean, reinterpret it as Open/Partially Delivered, or add a new visible status control in this change.

## Clear old data and resync
- After the schema and updated mapping are ready, **delete the existing Open Sales Orders records**, as requested. This affects only `open_sales_orders`, not Net Sales, TBN, settings or sync history.
- The report will remain empty until you run a successful fresh SAP sync. Do not backfill old amounts or automatically call SAP.
- Keep atomic VBELN + POSNR snapshot activation and failed-sync protection for subsequent syncs.

## Migration and deployment files
- Apply an additive database migration for the new fields and confirmed deprecation comments.
- Provide the matching timestamped SQL migration for Quality/Production, plus a **separate, clearly labeled old-data cleanup SQL file** and deployment instructions. Cleanup is not part of the schema migration.
- Update the shared SAP mapper and rebuild the self-hosted middleware synchronization bundle so all execution paths store the new fields.

## Validation
- Test the sample amounts **10,558,830**, **61,500**, and **555,000**; their total must be **11,175,330 rupees / 1.117533 Crore**.
- Test both LD_STATUS = **N** and **Y**, mixed-case key compatibility, numeric normalization, zero/missing KWERT_INR without NETWR fallback, and preservation of all supplied fields.
- Verify empty report behavior after cleanup, unchanged date/filter behavior, and consistent table/export value calculations using fixtures. Live totals and newly stored LD_STATUS can be verified after your fresh sync.