# Refresh the launchpad cards and module tabs

## Goal
Bring the launchpad closer to the attached Fiori reference while preserving the existing modules, permissions, live figures, and navigation.

This redesign applies to the launchpad only. Sales Dashboard cards and all other report-page cards will remain unchanged.

## Changes
- Restyle every launchpad card as a compact raised Fiori tile with a soft cool surface, subtle border and layered shadow, consistent corner radius, and a restrained lift on interaction.
- Strengthen card hierarchy: small category/eyebrow text, clear title or KPI value, muted supporting copy, compact status/footer area, and a softly tinted icon container.
- Keep the live Total Sales breakdown, but align its dimensions, spacing, icon treatment, progress bars, and typography with the other tiles.
- Add a compact bottom action strip to clickable tiles so destinations are obvious without changing where any card opens.
- Normalize tile heights and internal spacing so each module row looks aligned on desktop and remains readable in a stacked mobile layout.
- Refine module section headings and spacing to match the denser enterprise rhythm in the reference.
- Replace the current underline-only module selector with a polished Fiori-style tab bar. The selected tab will use a stronger filled/high-contrast state, clear visual weight, and a persistent indicator; unselected tabs remain quiet with precise hover and keyboard-focus states.
- Keep module filtering, role-based visibility, existing routes, and all dashboard data unchanged.
- Do not copy the screenshot as an image and do not add its Alerts or Settings controls; it is used only as the visual reference requested.

## Validation
- Verify card alignment, selected-tab clarity, hover/focus behavior, and module switching on desktop.
- Verify horizontal tab scrolling, card stacking, text fit, and touch targets on mobile.
- Confirm every clickable tile still opens its existing destination and hidden modules remain permission-controlled.

## Technical details
- Use the existing semantic design tokens, extending the shared theme only for reusable launchpad surface/shadow roles.
- Update the launchpad route and shared tile components so the treatment remains consistent across live KPI, standard KPI, chart, and launch tiles.
- Preserve dark-theme compatibility and reduced-motion behavior.
