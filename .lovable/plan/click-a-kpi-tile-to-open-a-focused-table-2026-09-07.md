# Click a KPI tile to open a focused table

## Behaviour

On the Net Sales screen, the **Total Sales** and **Billed Customers** tiles become clickable.

When one is clicked:

- Smart filters card stays visible and keeps working (dates, profit centre, search, and the All / Domestic / Services / Exports tabs all still apply).
- The KPI tiles row stays visible so the selection can be changed or cleared; the active tile is highlighted with a ring.
- Every other card is hidden: Top 10 cards, Sales trend, Sales mix, Main Group treemap and bar chart, Sales by Segment, and the normal Net Sales List.
- In their place, one clean focused table appears with a title, a record count, a CSV button, and a "Back to dashboard" control.

Clicking the same tile again (or Back) restores the full dashboard.

## The two tables

**Total Sales** — three columns:

| Profit centre | Customer name | Amount in local cur. |

Rows are grouped by profit centre + customer, amounts summed, sorted highest amount first, with a total row at the bottom.

**Billed Customers** — three columns:

| Customer name | Document No | Amount in local cur. |

Rows are grouped by customer + document, amounts summed, sorted highest amount first, with a total row at the bottom.

Both tables: sticky header, zebra rows, right-aligned amounts in the same Cr / L / K format used elsewhere, profit-centre colour dot on the Total Sales table for consistency, page size 50 with the existing pager, and a tooltip on any truncated name.

## Technical notes

- `src/components/sd-live-dashboard.tsx` only — no data, schema, filter-logic, or permission changes.
- Add `const [focus, setFocus] = useState<"revenue" | "customers" | null>(null)`; `KpiCard` gains optional `onClick` / `active` props (button semantics, keyboard focus) and is left untouched for the other tiles.
- Build the grouped rows with `useMemo` over the already-filtered `filtered` rows, so tabs and smart filters flow through automatically.
- New lightweight `FocusTable` component reusing the existing `Panel`, pager, `INRC`, and CSV export helpers.
- When `focus` is set, wrap the dashboard sections below the KPI grid in a conditional so nothing else renders; changing the tab or filters keeps the focused table open.
