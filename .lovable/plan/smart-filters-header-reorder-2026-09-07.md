# Smart filters header reorder

## Behaviour

On the Net Sales screen, in the **Smart filters** card header, reorder the right-side controls so the sequence is:

1. Search input
2. Reset button
3. Collapse/expand icon (chevron)

The left-side title cluster — Filter icon, "Smart filters" label, and active-filter badge count — stays unchanged.

## Changes

- `src/components/sd-live-dashboard.tsx`: rearrange the header row of the Smart filters card.
  - Keep the left title cluster as-is.
  - Move the collapse chevron from the title cluster to the right-side control cluster.
  - Place controls in this order: Search input, Reset button, chevron icon.
  - Preserve all existing behaviour: chevron rotates when expanded, Reset clears filters, Search filters rows.

## Verification

- Run `bunx tsgo --noEmit` to confirm no type errors.
- Open `/reports/module/sd` and confirm the Smart filters header shows Search, then Reset, then the collapse chevron, and that all three still work.
