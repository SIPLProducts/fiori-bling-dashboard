# Draggable cards, on-site logo fix, Home in the navbar

Three changes, all confirmed with you.

## 1. Logo missing on the on-site server

Confirmed cause: the HBL logo is not stored with the app. Both the login page and the top bar load it from an external Lovable address (`/__l5e/assets-v1/...`), which the on-site server cannot reach, so the picture stays blank there while it looks fine in the preview.

Fix: keep a real copy of the logo inside the app itself and point the login page and the top bar at that copy. It then works identically online and on the on-site server, with no server or web-server configuration change.

## 2. Draggable cards on the Management Sales Dashboard

Every block on the page becomes movable — the six top tiles and all chart panels (Sales Trend, Sales by Segment, Top Profit Centres, Top Customers, Pareto, Main Group, Sales vs Quantity, Alerts) — and they can be mixed freely, so a chart can be dropped among the tiles and vice versa.

Behaviour:
- Grab any card and drop it on another to swap it into that position.
- The cursor changes to a grab hand and the dragged card dims slightly; the drop target shows a blue outline.
- The chosen arrangement is remembered per browser, so it is still there next visit.
- A small "Reset layout" entry appears next to the Filters button to return to the default order.
- Clicking a card (drill-down, month select, customer select) keeps working exactly as today.

Cards keep sensible widths: each card declares its own column span, so wide charts stay wide wherever they land.

## 3. Home icon moved to the navbar

- The dashboard header loses its "Net Sales" back button; that space goes to the title and the date/filter controls.
- A Home icon is added to the blue top bar (left of the search icon) that returns to the launchpad, available on every screen.

## Technical notes

- `src/assets/hbl-logo.png` is restored as a real file and imported directly; the `.asset.json` pointer usage in `src/routes/auth.tsx` and `src/components/shell-bar.tsx` is replaced with that import.
- New `src/components/management/card-grid.tsx`: an id-ordered list persisted in `localStorage` under `mgmt-card-order`, using the same native HTML5 drag pattern already used for the Net Sales KPI tiles (`draggable`, `onDragStart`, `onDragOver`, `onDrop`).
- `src/components/management/dashboard.tsx` renders one flat 12-column grid; each card entry carries `{ id, span, node }` so layout survives reordering. Existing KPI and chart components are unchanged apart from being wrapped.
- `src/components/management/header.tsx`: remove the back `Link`, add the "Reset layout" control.
- `src/components/shell-bar.tsx`: add a Home `Link` to `/launchpad` with the `Home` lucide icon.
- No data, permission, or database changes.

## Validation

Typecheck, then an authenticated browser pass on `/management-dashboard`: drag a chart into the tile row, reload and confirm the order persists, reset the layout, and confirm the logo renders in a static build.
