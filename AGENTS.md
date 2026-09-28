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
