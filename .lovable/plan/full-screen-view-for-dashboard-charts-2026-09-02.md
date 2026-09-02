# Full-screen view for dashboard charts

## What changes

Add a small expand (full-screen) icon button in the top-right corner of these cards:

- Revenue trend
- Sales mix by type
- Volume & average realization by month
- Top customers

Clicking the icon (or the card header area) opens the same chart in a full-screen overlay with the card title, the chart rendered at full width/height, and a close button. Pressing Escape or clicking outside closes it and returns to the dashboard. The icon toggles to a "collapse" icon while expanded.

Charts already resize responsively, so the same chart content simply renders larger — no separate full-screen-only version.

## Technical notes

- `src/components/report-shell.tsx`: extend `Panel` with an optional `expandable` prop. When set, render a ghost icon button (`Maximize2` from lucide-react) in the existing `actions` slot area, and render children inside a shadcn `Dialog` (near-viewport-size content, `max-w-[95vw] h-[90vh]`) when expanded. Keep normal inline rendering when collapsed, so state and charts stay simple by rendering children in one place at a time.
- `src/components/sd-live-dashboard.tsx`: pass `expandable` to the four panels above; give the chart containers a height that fills the dialog (e.g. `h-full` wrapper with `ResponsiveContainer height="100%"` when expanded, via a render-prop or a `fullscreen` flag passed to children).
- No data, query, or schema changes.
