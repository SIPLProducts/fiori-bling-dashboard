# Reduce space after date-picker icon and adjust Posting date columns

## Goal
Tighten the right-side spacing inside the **Posting from** and **Posting to** date inputs so the browser calendar icon sits closer to the right edge, matching the reference screenshot. Also make the Posting from / Posting to fields occupy 2 columns when space allows, otherwise 3 columns.

## Current state
- `src/components/sd-live-dashboard.tsx` lines 1320–1334 contain the two date inputs.
- They currently use `className="mt-1 h-9 pr-1"`.
- The inputs live in a 4-column grid (`lg:grid-cols-4`) inside the Smart Filters card.

## Changes
1. In `src/components/sd-live-dashboard.tsx`, change both date inputs from `pr-1` to `pr-0` (or an equivalent small override) so the calendar icon is flush with the right edge.
2. If `pr-0` is overridden by the base `Input` padding, add an inline style or a scoped CSS override targeting `::-webkit-calendar-picker-indicator` / `::-webkit-inner-spin-button` to remove the indicator's internal margin.
3. Wrap **Posting from** and **Posting to** in a sub-grid so they share 2 columns on large screens and 3 columns on medium screens (when the 4-column parent grid is active), keeping Profit centre in its own column.
4. Keep the parent Smart Filters grid as `lg:grid-cols-4` so Profit centre and other filters remain aligned.

## Verification
- Run `bunx tsgo --noEmit` to confirm no type errors.
- Use Playwright to open `/reports/module/sd`, wait for Smart Filters, and screenshot the date inputs to confirm the icon is at the right edge with minimal trailing space and the two date inputs span the requested columns.

## Notes
- The placeholder text shown in the reference ("dd-mm-yyyy") is controlled by the browser's locale/date input rendering; no code change is needed unless the user explicitly requests a custom placeholder.
- No schema, data, or route changes are required.

