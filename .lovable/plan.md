# Add TBN chart drill-downs

## What will change
- Make each Debit, Credit, and Net chart segment selectable without changing the dashboard filters.
- Open a focused detail window for the selected chart value, showing its profit centre, measure, exact total, and every contributing GL entry.
- Include GL code, description, debit, credit, net, and contribution to the selected value; sort the largest contributors first.
- Add search within the detail window and show a clear empty state when no GL entries contribute.
- Extend the same drill-down to the Debit/Credit composition chart and Leading GL Debit vs Credit chart.
- Preserve existing chart tooltips, dashboard filters, PDF export, live refresh, and full-table access.

## Interaction and accessibility
- Use the exact selected series when clicking paired bars, so Debit and Credit open different contributing rows.
- Support keyboard selection on chart data where the chart library exposes focusable elements, with descriptive labels and visible selection cues.
- Keep the detail table responsive with horizontal scrolling on small screens.

## Validation
- Test contributor calculations against dashboard totals and confirm the grand-total source row remains excluded.
- Verify chart selection, detail search, desktop/mobile layout, type checks, and the application build.
