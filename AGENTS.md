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

- Keep ZTBN source-aligned, paginated and horizontally scrollable; disable scheduled sync pending its dedicated SAP mapper.
- Read TBN exclusively from public.ztbn; refresh through one cleaned-up Realtime subscription with periodic fallback.
- Capture PDFs by visual rows with repeated headers/numbered footers; preserve screen colors and independent PDF geometry. Exclude sync metadata and unmount the Open Orders screen header during capture.
- Default Sales and Net Sales launchpad to the current April–March FY; explicit shared/URL dates override reports. Name PDFs by the FY ending year.
- Activate validated ZFISALES snapshots under an advisory lock by Posting Date range; never replace active rows on empty or failed staging.
- Keep Sales/Open Orders datasets stable across navigation; refresh only explicitly.
- Store multiple sync times in backward-compatible IST:HH:mm,... expressions.
- Give coming-soon screens stable routes and permission keys through a shared placeholder.
- Derive Model Wise Type from filtered product_type; retain full ranking on screen and export Top 10.
- Manual/test Open Orders requests use saved fkdat; scheduled requests use today's local date.
- Activate Open Orders atomically by VBELN + POSNR; retain typed fields and complete raw rows. Read every active paginated row.
- Use a pure active date-mode boundary helper; Open Orders launchpad reads all active rows without date/document-type restrictions to cover the complete snapshot.
- Align filters through desktop-only placement and equal label tracks. Bulk selection is opt-in; null means unrestricted and [] means none.
- Use pure source-backed filter/code-description helpers; keep customer identity by sold-to code. Map S_VTWEG before VTWEG; reuse stored channel/sales_type and industry_description for labels.
- Share pure detailed-table status/search/date-sort helpers with pagination and Excel; table-only controls must not affect dashboard totals.
- Keep readable responsive screen charts and side-by-side donut/table tracks with local overflow; preserve independent PDF sizing.
- Root ThemeProvider shares appearance with exports; use shared colors and gradients.
- Group plants by code; fit plant/zone categories in width-aware rows with explicit-unit scales and fixed PDF heights.
- Use pure helpers for launchpad/table totals and filtered exact-text LD status aggregates; capture LD chart separately in PDF to avoid crowding existing cards.
- Persist AH and monetary/status fields as typed columns alongside raw SAP rows; include them in report queries/search/exports. Use typed monetary source everywhere; open_value is a compatibility mirror.
- Mirror Cloud migrations in timestamped supabase/migrations for self-hosted deployment.
- Retire absent SAP business mappings additively with deprecation comments; preserve internal sync fields and harmless older key aliases.
