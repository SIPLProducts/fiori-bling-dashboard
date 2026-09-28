# Net Sales List selected-column CSV export

## Confirmed current behavior
- SAP `MODEL`, `RANGE`, and `TYPE` are stored as Model, Range, and Type and are loaded into the Net Sales List.
- The table’s Columns selector correctly controls which columns are visible.
- The CSV action currently ignores that selection and exports every configured Net Sales List column.

## Changes
1. Make the Net Sales List CSV action use the table’s current visible-column selection.
2. Preserve the selected columns’ on-screen order and labels in the downloaded file.
3. Export all filtered Net Sales List rows, not only the current page.
4. Keep Model, Range, and Type values sourced from their existing SAP-backed fields without changing synchronization or stored data.
5. Add focused tests covering selected-column export, column order, numeric values, and Model/Range/Type mappings.

## Technical details
- Move CSV row construction close to the Net Sales List column state, or pass the visible column definitions into the export handler.
- Reuse the same column definitions for table rendering and CSV output so the two cannot drift.
- Keep the existing UTF-8 CSV download behavior and current dashboard filters.
