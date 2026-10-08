<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep ZTBN source-aligned by `source_row_no`; disable scheduled sync until a dedicated SAP mapper exists because its 261-column format differs from sales.
- Present ZTBN reporting through a paginated, horizontally scrollable TBN view because the source has 261 business columns and cannot fit a fixed dashboard grid.
- Treat `public.ztbn` as the sole TBN dashboard source and refresh its cached dashboard/table queries through one cleaned-up Realtime subscription, with periodic refresh as a connection fallback.
- Compose dashboard PDFs from separately captured visual rows, with repeatable headers and numbered footers, because arbitrary image slicing clips cards.
- Default Sales reports to the current April–March fiscal year while allowing explicit shared or URL date selections to override it, so opening totals are current and drill-down context is preserved.
- Activate ZFISALES snapshots by their validated Posting Date range under an advisory lock, preserving existing active rows when SAP returns no usable data or staging fails.
- Keep Sales report datasets stable across tab and screen navigation; load newer committed snapshots only through the explicit Refresh action.
- Store multiple daily SAP sync times as an `IST:HH:mm,...` schedule expression so self-hosted middleware and hosted scheduling share one backward-compatible field.
- Give coming-soon screens stable routes and permission keys with a shared placeholder, so replacements preserve access and navigation.
- Scope launchpad sales totals to the same current April–March fiscal-year window as Sales reports, so entry-point cards and dashboards reconcile.
- Derive Model Wise Type reporting from filtered ZFISALES `product_type` values, retain its complete amount ranking for screen controls, and limit PDF output to Top 10.
- Label Sales PDF periods by the April–March ending year (for example, the 2026–27 selection is FY27), because financial reporting names the period by its closing year.
- Send the saved `fkdat` for Open Sales Orders tests and manual syncs, but replace it with the current local date for scheduled syncs, because administrators need reproducible manual requests and rolling daily automation.
- Store atomic Open Orders snapshots by active `VBELN + POSNR`, with typed fields and raw SAP rows, so missing orders vanish without partial syncs.
- Drive the Open Sales Orders report from active `open_sales_orders` snapshots, loading every paginated row and refreshing only on explicit user action so all filters, metrics, charts, rankings, and details reconcile.
- Keep the Open Orders launchpad scoped to current-FY active ZDOR, ZEOR, and ZSOR rows independently of report date defaults.
- Keep Open Sales Orders bulk selection opt-in on the shared MultiSelect; use null for unrestricted filters and empty arrays for explicit no-selection so other reports retain their existing semantics.
- Use pure Open Orders filter/code-description helpers and stored sales_type descriptions so selections and totals reconcile.
- Key Open Sales Orders customer filters by sold-to code with source-backed display labels so same-name customers stay distinct.
- Reuse the stored industry_description mapped from VTEXT_DI for Open Sales Orders division labels, avoiding a larger raw-response fetch for display-only descriptions.
- Derive Open Sales Orders detailed-table status/search results through one frontend filter shared by pagination, counts, and Excel export, so table-only controls stay consistent without changing dashboard metrics.
- Keep Open Orders readable chart heights and responsive grids in the screen-only wrapper; preserve PDF geometry and calculations independently.
- Keep overview donut/table tracks side by side with local overflow at narrow widths; isolate screen chart-row arrangement from PDF geometry to preserve readable totals and exports.
- Share Open Orders colors/gradients across screen and PDF; use layout-only PDF safeguards to prevent palette drift.
- Manage appearance in the root ThemeProvider using semantic CSS tokens and browser storage; one shared state keeps navigation and chart exports consistent.

- Group plants by code; fit all plant/zone categories in one width-aware row with compact bars and explicit-unit scales to avoid repeated plots. Share width/gradient helpers; keep zone PDF capture separate to preserve exports.
- Use pure helpers for full table totals and filtered order counts to isolate pagination and test metrics.
- Persist Open Sales Orders AH measures as typed numeric columns alongside raw SAP rows and include them in the report query, table search, and export so existing and future snapshots agree.
- Mirror Cloud migrations exactly in timestamped supabase/migrations files for self-hosted deployment.
