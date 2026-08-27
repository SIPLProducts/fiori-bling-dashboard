# Remove T-codes from the Sales Distribution dropdown

The nav dropdown still shows the T-code (`ZFISALES_MIS`, `ZVF05_FIN_N`, `ZVF05_SAL`) under each report name. Remove it so the menu lists only the screen names.

## Changes

- Sales Distribution dropdown in the top bar: each item shows just the report name on one line; the small muted T-code line is removed.
- Screen Permissions list: screen labels currently read "Sales report KPI (ZFISALES_MIS)" — shown as plain names too.
- The report page header keeps the small T-code under the big title (as agreed earlier). No other change.

## Technical notes

- `src/components/shell-bar.tsx`: drop the `<span>{report.tcode}</span>` line from the SD dropdown items and simplify the link back to a single label.
- `src/lib/screens.ts`: build the SD screen labels from `report.title` only, without the `(${report.tcode})` suffix.
- `SD_REPORTS.tcode` stays in the metadata since the report headers still use it.
