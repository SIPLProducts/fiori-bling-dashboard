# Create and populate the ZTBN table

## Goal
Add **ZTBN** under **Tables Master**, mirror the attached workbook’s wide format, and import every attached data row.

## 1. Create the ZTBN data table
- Create `public.ztbn` with the workbook’s **261 source columns**:
  - `GL Code` and `GL Description` stored as text, preserving leading zeros.
  - The 258 profit-centre Debit/Credit columns and `Cumm.balance` stored as numeric values.
- Add a generated row ID and import timestamp for safe row identity. `GL Code` cannot be the sole database key because the workbook’s final grand-total row has a blank code.
- Convert workbook headings into safe lowercase database field names while preserving every original heading as its visible label.
- Resolve the six truncated duplicate headings with deterministic Debit/Credit field names, ensuring neither column is overwritten.
- Allow signed-in users to read ZTBN; reserve writes for trusted server/admin processes. Add the required database grants and row-level access rules.

## 2. Register ZTBN in Tables Master
- Add one Tables Master entry:
  - Display name: `ZTBN`
  - Table key/name: `ztbn`
  - SAP API name: `ZTBN`
- Add all 261 field definitions in workbook order, including visible labels, safe field names, numeric/text types, and SAP source labels.
- Keep scheduled synchronization paused initially because there is currently no configured ZTBN SAP endpoint path or system. The table remains linked to API name `ZTBN` and can be enabled after that endpoint is configured.

## 3. Import the attached workbook
- Import all **796 rows** from `Copy_of_ztbn-format.xlsx`.
- Preserve the 795 detailed GL rows and the final blank-GL grand-total row.
- Import the uploaded values exactly as supplied; no formulas or derived calculations will replace them.
- Make the import repeat-safe so rerunning the setup does not duplicate the attached snapshot.

## 4. Verify
- Confirm ZTBN appears in Tables Master with 261 configured source fields.
- Confirm the physical table contains exactly 796 imported rows.
- Spot-check leading-zero GL codes, Debit/Credit pairs, and the final cumulative balance against the workbook.
- Confirm a signed-in user can read the table while anonymous and direct browser writes remain blocked.

## Technical notes
- The workbook has one sheet (`Data`), 261 columns, 796 data rows, no formulas, and numeric values in all amount columns.
- No existing `ztbn` table, Table Master mapping, or `ZTBN` SAP endpoint was found.
- The schema/setup will be reproducible for Quality and Production deployment; the uploaded workbook data will be represented as an explicit import rather than page-load seeding.
