# Stabilize Sales Dashboard totals

## Confirmed cause
- **Total Sales is not independently changing.** It is the sum of the same downloaded rowset used by the charts, filters, AH cards, and Net Sales List, so an inconsistent download can affect every figure.
- The 33,909 records are downloaded through many parallel paged requests.
- Those requests sort only by posting date. Many records share the same date, so their order between pages is not guaranteed; a record can be skipped or repeated.
- The dashboard query does not explicitly restrict reads to active SAP snapshots. The database normally hides inactive rows, but administrators are allowed to see them, so an administrator can read temporary synchronization rows.
- A page load occurring while SAP data is being activated can combine pages from two dataset versions.

## SAP field-key confirmation
- The six requested fields are already saved on every mapped SAP row:
  - `BELNR` → Document No
  - `GJAHR` → Fiscal Year
  - `HKONT` → G/L
  - `AUBEL` → Sales Order
  - `AUPOS` → Sales Order Item
  - `POSNR` (with `BUZEI` fallback) → Document Item
- The original SAP object is also retained, so these source values remain available for audit.
- The uploaded Production response contains 115 rows. BELNR, GJAHR, HKONT, AUBEL, AUPOS, and POSNR are present on every row; all 115 are unique by the first five fields and there are no exact duplicate rows.
- That Production sample can be stored safely. However, the complete active history has 33,909 rows but only 31,808 distinct six-field combinations, because older/imported rows commonly contain `0` for POSNR and AUPOS. Enforcing this combination as a database-wide unique key would incorrectly discard 2,101 valid historical rows.
- Keep the existing full-row identity plus occurrence number, which preserves distinct rows and exact repeated occurrences. Add an explicit mapper test covering all six requested fields rather than changing the proven identity strategy.

## Fix
1. Explicitly request only `is_active_snapshot = true` records for this dashboard, including administrator sessions.
2. Use a unique, deterministic paging order: posting date followed by record ID.
3. Add a consistency check around the paged download. If the active dataset changes while pages are loading, discard that mixed result and reload the completed active dataset instead of displaying an incorrect total.
4. Keep one completed rowset as the source for Total Sales, every chart, AH metrics, filters, PDF export, CSV export, and the Net Sales List.
5. Preserve the current dashboard design and calculations; only data-read consistency changes.

## Expected behavior after the fix
- While a sync is inserting or validating records, users continue seeing the previous complete snapshot with unchanged values.
- Only after the entire new snapshot is successfully stored and activated may dashboard values change.
- A failed or incomplete sync never replaces the previous completed data.
- Every valid SAP row and every repeated occurrence remains stored; the fix does not deduplicate using the five requested fields.

## Verification
- Test that records sharing the same posting date are returned once, with no gaps or duplicates.
- Test that inactive/staging rows never enter dashboard calculations for administrators.
- Test that a snapshot change during pagination triggers a clean retry rather than a mixed total.
- Test that BELNR, GJAHR, HKONT, AUBEL, AUPOS, and POSNR are all persisted to their mapped columns during snapshot insertion.
- Test that two valid rows sharing the six-field combination are both preserved when other SAP values differ.
- Compare the dashboard row count and Total Sales with one direct active-data database total across repeated reloads.
- Confirm repeated refreshes show an identical Total Sales value when no new completed SAP sync has changed the source data.

## Files expected to change
- `src/lib/sd-live.ts` — active-only, deterministic, consistency-checked dashboard loading.
- `tests/sd-live-filters.test.ts` — stable paging and dashboard-rowset regression coverage.
- `tests/zfisales-map.test.ts` — explicit six-field mapping and duplicate-preservation coverage.
- `roadmap.md` — track completion.

No database schema or SAP mapper change is required for BELNR, GJAHR, HKONT, AUBEL, AUPOS, or POSNR because all six are already stored. The generated on-prem middleware bundle only needs rebuilding if mapper code changes during implementation.
