# Multi-select checkboxes for Year and Month (Daily Production Report)

Year and Month become checkbox dropdowns like Plant and Material, so you can tick several at once (for example April, May and June 2026).

- On opening and on Reset, only the latest year and month are ticked (June 2026 today).
- Months list shows months from all ticked years, latest first.
- Ticking every option, or none, means "All".
- Tiles, cards, table and exports follow the ticked years and months; Posting Date From/To still narrow further.

## Technical details
- `src/lib/daily-production-filters.ts`: `year`/`month` become `string[] | null` (null = all); `dprDateOptions` takes the selected years; `matchesDprDates` checks inclusion.
- `src/components/daily-production-dashboard.tsx`: replace the `Select`-based `periodField` with `FilterMultiSelect`.
- Update `daily-production-filters.test.ts` for multiple years/months.
