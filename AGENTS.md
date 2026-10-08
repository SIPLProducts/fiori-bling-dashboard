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

- Keep ZTBN as a wide source-aligned table keyed by `source_row_no`, with scheduled sync disabled until a dedicated SAP endpoint and mapper exist, because its 261-column trial-balance format does not match the sales sync model.
- Present ZTBN reporting through a paginated, horizontally scrollable TBN view because the source has 261 business columns and cannot fit a fixed dashboard grid.
- Treat `public.ztbn` as the sole TBN dashboard source and refresh its cached dashboard/table queries through one cleaned-up Realtime subscription, with periodic refresh as a connection fallback.
- Compose dashboard PDFs from separately captured visual rows, with repeatable headers and numbered footers, because arbitrary image slicing clips cards.
- Default Sales reports to the current April–March fiscal year while allowing explicit shared or URL date selections to override it, so opening totals are current and drill-down context is preserved.
- Activate ZFISALES snapshots by their validated Posting Date range under an advisory lock, preserving existing active rows when SAP returns no usable data or staging fails.
- Keep Sales report datasets stable across tab and screen navigation; load newer committed snapshots only through the explicit Refresh action.
- Store multiple daily SAP sync times as an `IST:HH:mm,...` schedule expression so self-hosted middleware and hosted scheduling share one backward-compatible field.
- Give each coming-soon business screen a stable route and permission key backed by one shared placeholder component, so live reports can replace placeholders without changing access or navigation.
- Scope launchpad sales totals to the same current April–March fiscal-year window as Sales reports, so entry-point cards and dashboards reconcile.
- Derive Model Wise Type reporting from filtered ZFISALES `product_type` values, retain its complete amount ranking for screen controls, and limit PDF output to Top 10.
- Label Sales PDF periods by the April–March ending year (for example, the 2026–27 selection is FY27), because financial reporting names the period by its closing year.
- Send the saved `fkdat` for Open Sales Orders tests and manual syncs, but replace it with the current local date for scheduled syncs, because administrators need reproducible manual requests and rolling daily automation.
- Persist Open Sales Orders as validated atomic snapshots keyed by active `VBELN + POSNR`, preserving typed reporting fields plus the complete raw SAP row, because missing orders must be removed without exposing partial syncs.
- Drive the Open Sales Orders report from active `open_sales_orders` snapshots, loading every paginated row and refreshing only on explicit user action so all filters, metrics, charts, rankings, and details reconcile.
- Scope the Open Sales Orders launchpad value and line count to active ZDOR, ZEOR, and ZSOR rows in the current April–March financial year, so it matches the report's opening view.
- Keep Open Sales Orders bulk selection opt-in on the shared MultiSelect; use null for unrestricted filters and empty arrays for explicit no-selection so other reports retain their existing semantics.
- Display unrestricted Open Sales Orders years as unchecked while a Date Range is active, because date-only filtering must not appear as an explicit selection of every financial year.
- Key Open Sales Orders customer filters by sold-to code with source-backed display labels so same-name customers stay distinct.
- Reuse the stored industry_description mapped from VTEXT_DI for Open Sales Orders division labels, avoiding a larger raw-response fetch for display-only descriptions.
- Derive Open Sales Orders detailed-table status/search results through one frontend filter shared by pagination, counts, and Excel export, so table-only controls stay consistent without changing dashboard metrics.
- Scope compact Open Sales Orders spacing to the screen-only wrapper and use document-type row attributes for semantic tints, keeping PDF geometry and reporting logic independent from presentation.
- Use stable side-by-side donut/table tracks with local overflow for the Open Orders document-type card, because readable center totals and business columns must not be compressed by dashboard breakpoints.
- Keep ranking colors and chart-header dividers configurable through shared Open Orders presentation components so styling stays scoped to selected cards and consistent in PDF exports.

- Aggregate plants by code; render all plant and zone categories in a single width-aware chart row with compact bars and explicit-unit scales, because repeated plot rows waste vertical space. Share width/gradient helpers; keep zone PDF capture separate to preserve exports.
- Sum complete table-filtered rows in a pure footer helper so pagination never changes totals.
- Persist Open Sales Orders AH measures as typed numeric columns alongside raw SAP rows and include them in the report query, table search, and export so existing and future snapshots agree.
- Mirror Cloud migrations byte-for-byte into timestamped supabase/migrations files because self-hosted deployment consumes that directory.
