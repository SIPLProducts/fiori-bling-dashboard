# Stabilize Sales Dashboard totals

## Confirmed cause
- **Total Sales is not independently changing.** It is the sum of the same downloaded rowset used by the charts, filters, AH cards, and Net Sales List, so an inconsistent download can affect every figure.
- The 33,909 records are downloaded through many parallel paged requests.
- Those requests sort only by posting date. Many records share the same date, so their order between pages is not guaranteed; a record can be skipped or repeated.
- The dashboard query does not explicitly restrict reads to active SAP snapshots. The database normally hides inactive rows, but administrators are allowed to see them, so an administrator can read temporary synchronization rows.
- A page load occurring while SAP data is being activated can combine pages from two dataset versions.

## SAP field-key confirmation
- The five requested fields are already saved on every mapped SAP row:
  - `BELNR` → Document No
  - `GJAHR` → Fiscal Year
  - `HKONT` → G/L
  - `AUBEL` → Sales Order
  - `AUPOS` → Sales Order Item
- The original SAP object is also retained, so these source values remain available for audit.
- This combination must **not** become the unique database key: the current 33,909 active rows contain only 31,808 distinct five-field combinations. Enforcing uniqueness would incorrectly discard 2,101 valid rows.
- Keep the existing full-row identity plus occurrence number, which preserves distinct rows and exact repeated occurrences. Add an explicit mapper test covering all five requested fields rather than changing the proven identity strategy.

## Fix
1. Explicitly request only `is_active_snapshot = true` records for this dashboard, including administrator sessions.
2. Use a unique, deterministic paging order: posting date followed by record ID.
3. Add a consistency check around the paged download. If the active dataset changes while pages are loading, discard that mixed result and reload the completed active dataset instead of displaying an incorrect total.
4. Keep one completed rowset as the source for Total Sales, every chart, AH metrics, filters, PDF export, CSV export, and the Net Sales List.
5. Preserve the current dashboard design and calculations; only data-read consistency changes.

## Verification
- Test that records sharing the same posting date are returned once, with no gaps or duplicates.
- Test that inactive/staging rows never enter dashboard calculations for administrators.
- Test that a snapshot change during pagination triggers a clean retry rather than a mixed total.
- Test that BELNR, GJAHR, HKONT, AUBEL, and AUPOS are all persisted to their mapped columns during snapshot insertion.
- Test that two valid rows sharing the five-field combination are both preserved when other SAP values differ.
- Compare the dashboard row count and Total Sales with one direct active-data database total across repeated reloads.
- Confirm repeated refreshes show an identical Total Sales value when no new completed SAP sync has changed the source data.

## Files expected to change
- `src/lib/sd-live.ts` — active-only, deterministic, consistency-checked dashboard loading.
- `tests/sd-live-filters.test.ts` — stable paging and dashboard-rowset regression coverage.
- `tests/zfisales-map.test.ts` — explicit five-field mapping and duplicate-preservation coverage.
- `roadmap.md` — track completion.

No database schema or SAP mapper change is required for BELNR, GJAHR, HKONT, AUBEL, or AUPOS because all five are already stored. The generated on-prem middleware bundle only needs rebuilding if mapper code changes during implementation.
