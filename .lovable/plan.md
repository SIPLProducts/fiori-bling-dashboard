# Tighten Net Sales Smart Filters spacing

## Behaviour

On the Net Sales screen, reduce the empty space inside the **Smart filters** card so the Posting from, Posting to and Profit centre controls sit closer together.

## Changes

- `src/components/sd-live-dashboard.tsx`:
  - Reduce the outer filter grid gap (`gap-3` → `gap-2`).
  - Reduce the Posting from / Posting to inner wrapper gap (`gap-3` → `gap-2`).
  - Remove or shrink the `mt-1` spacing above each input so labels sit closer to their controls.
  - Keep the existing responsive column layout (`md:grid-cols-2 lg:grid-cols-3`) and the current date-input compact padding.
  - Preserve all existing behaviour: filters still apply, Reset still clears, collapse/expand still works.

## Verification

- Run `bunx tsgo --noEmit` to confirm no type errors.
- Open `/reports/module/sd`, expand Smart filters, and confirm Posting from, Posting to and Profit centre are visibly tighter with less internal padding/gap.
