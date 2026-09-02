# Sales report KPI — label and title fixes

Two small presentation fixes on the Sales report KPI dashboard.

## 1. Rename the document table

The table card currently titled "Document lines (31,862)" becomes "ZFISALES_MIS List (31,862)" — same count, same columns, only the heading text changes.

## 2. Keep chart value labels on one line

On "Top customers" (and the other bar charts using the same helper) the value labels break as:

```text
72.22
Cr
```

They must render as `72.22 Cr` on a single line.

## Technical notes

- `src/components/sd-live-dashboard.tsx`
  - Line ~423: change the `title` passed to the table panel to `ZFISALES_MIS List (…)`.
  - `compact()` (line ~57): join the number and its unit with a non-breaking space (`\u00A0`) so the chart's SVG text component cannot wrap at that gap. This fixes Top customers, Top materials, Revenue trend and axis labels at once.
  - `HBar` right margin bumped slightly so the wider single-line label is not clipped at the plot edge.
- No data, filter or query changes.
